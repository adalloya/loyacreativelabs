"use client";

import React, { useState, useMemo } from "react";
import {
    Utensils,
    Plus,
    Trash2,
    CheckCircle2,
    Circle,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    AlertCircle,
    Flame,
    Check,
    Pill,
    Camera
} from "lucide-react";
import {
    MEAL_CATEGORIES,
    MealCategory,
    FoodItem,
    DailyNutritionLog,
    createEmptyDailyNutritionLog,
    calculateDailyNutritionTotals,
    getLocalDateString,
    formatFriendlyDate,
    findPendingNutritionDates
} from "@/lib/nutrition-tracker";
import { SupplementDose } from "@/lib/nutrition-logistics";
import { FoodCameraScannerModal } from "./FoodCameraScannerModal";

interface DailyMealTrackerProps {
    targetCalories: number;
    targetProteinG: number;
    supplements: SupplementDose[];
    allNutritionLogs: Record<string, DailyNutritionLog>;
    onSaveLog: (date: string, log: DailyNutritionLog) => void;
    activeDate?: string;
    onSelectDate?: (date: string) => void;
    dietPlan?: any;
    onGoToCalendar?: () => void;
}

export const DailyMealTracker: React.FC<DailyMealTrackerProps> = ({
    targetCalories,
    targetProteinG,
    supplements,
    allNutritionLogs,
    onSaveLog,
    activeDate,
    onSelectDate,
    dietPlan,
    onGoToCalendar
}) => {
    // Current date in view
    const todayStr = useMemo(() => getLocalDateString(), []);
    const selectedDate = activeDate || todayStr;

    // Active log for selected date
    const currentLog: DailyNutritionLog = useMemo(() => {
        return allNutritionLogs[selectedDate] || createEmptyDailyNutritionLog(selectedDate);
    }, [allNutritionLogs, selectedDate]);

    // Totals for active date
    const totals = useMemo(() => {
        return calculateDailyNutritionTotals(currentLog);
    }, [currentLog]);

    // Check for pending past days
    const pendingDates = useMemo(() => {
        return findPendingNutritionDates(allNutritionLogs, 7);
    }, [allNutritionLogs]);

    // Local form state for adding a food to a category
    const [activeCategory, setActiveCategory] = useState<MealCategory | null>(null);
    const [foodName, setFoodName] = useState("");
    const [foodCalories, setFoodCalories] = useState("");
    const [foodProtein, setFoodProtein] = useState("");

    // Food Camera Scanner Modal state
    const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);
    const [foodScannerCategory, setFoodScannerCategory] = useState<MealCategory | null>(null);

    const handleAddScannedFood = (
        category: MealCategory,
        scanned: { name: string; calories: number; proteinG?: number; carbsG?: number; fatsG?: number; portionsText?: string }
    ) => {
        const newItem: FoodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: scanned.portionsText ? `${scanned.name} (${scanned.portionsText})` : scanned.name,
            calories: scanned.calories,
            proteinG: scanned.proteinG,
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
        };

        const updatedMeals = {
            ...currentLog.meals,
            [category]: [...(currentLog.meals[category] || []), newItem]
        };

        const updatedLog: DailyNutritionLog = {
            ...currentLog,
            meals: updatedMeals
        };

        onSaveLog(selectedDate, updatedLog);
    };

    // Date navigation
    const handleShiftDate = (days: number) => {
        const parts = selectedDate.split("-");
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        d.setDate(d.getDate() + days);
        const newDateStr = getLocalDateString(d);
        if (onSelectDate) onSelectDate(newDateStr);
    };

    // Add food item
    const handleAddFood = (category: MealCategory) => {
        if (!foodName.trim()) return;

        const cal = Math.max(0, parseInt(foodCalories, 10) || 0);
        const prot = Math.max(0, parseInt(foodProtein, 10) || 0);

        const newItem: FoodItem = {
            id: `food_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: foodName.trim(),
            calories: cal,
            proteinG: prot > 0 ? prot : undefined,
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
        };

        const updatedMeals = {
            ...currentLog.meals,
            [category]: [...(currentLog.meals[category] || []), newItem]
        };

        const updatedLog: DailyNutritionLog = {
            ...currentLog,
            meals: updatedMeals
        };

        onSaveLog(selectedDate, updatedLog);

        // Reset input fields
        setFoodName("");
        setFoodCalories("");
        setFoodProtein("");
        setActiveCategory(null);
    };

    // Remove food item
    const handleRemoveFood = (category: MealCategory, itemId: string) => {
        const updatedMeals = {
            ...currentLog.meals,
            [category]: (currentLog.meals[category] || []).filter(item => item.id !== itemId)
        };
        onSaveLog(selectedDate, {
            ...currentLog,
            meals: updatedMeals
        });
    };

    // Toggle supplement
    const handleToggleSupplement = (supName: string) => {
        const currentTaken = !!currentLog.supplementsTaken?.[supName];
        const updatedSupplements = {
            ...(currentLog.supplementsTaken || {}),
            [supName]: !currentTaken
        };

        onSaveLog(selectedDate, {
            ...currentLog,
            supplementsTaken: updatedSupplements
        });
    };

    // Pre-fill from Gemini plan if available
    const handlePrefillFromPlan = (category: MealCategory) => {
        if (!dietPlan) return;

        const meals = (dietPlan.thirtyDayPlan?.[0]?.meals) || (dietPlan.weeklyTemplates?.[0]?.meals) || [];
        const categoryIndexMap: Record<MealCategory, number> = {
            breakfast: 0,
            snack1: 1,
            lunch: 2,
            snack2: 3,
            dinner: 4
        };

        const mealData = meals[categoryIndexMap[category]];
        if (!mealData) return;

        const mealName = mealData.mealName || mealData.name || "Comida del Plan";
        const calories = mealData.calories || Math.round(((mealData.macros?.proteinG || 0) * 4) + ((mealData.macros?.carbsG || 0) * 4) + ((mealData.macros?.fatsG || 0) * 9)) || 350;
        const protein = mealData.proteinG || mealData.macros?.proteinG || 0;

        const newItem: FoodItem = {
            id: `plan_${Date.now()}`,
            name: `${mealName} (Plan IA)`,
            calories,
            proteinG: protein,
            time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
        };

        const updatedMeals = {
            ...currentLog.meals,
            [category]: [...(currentLog.meals[category] || []), newItem]
        };

        onSaveLog(selectedDate, {
            ...currentLog,
            meals: updatedMeals
        });
    };

    // Calculation stats
    const calorieDiff = totals.totalCalories - targetCalories;
    const caloriePct = targetCalories > 0 ? Math.min(100, Math.round((totals.totalCalories / targetCalories) * 100)) : 0;
    const supplementsCount = supplements.length;
    const supplementsTakenCount = supplements.filter(s => currentLog.supplementsTaken?.[s.name]).length;

    const isToday = selectedDate === todayStr;

    return (
        <div className="space-y-6">
            {/* Warning banner if there are unlogged past days */}
            {pendingDates.length > 0 && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0">
                            <AlertCircle size={16} />
                        </div>
                        <div>
                            <span className="font-bold text-white block">
                                Tienes {pendingDates.length} {pendingDates.length === 1 ? "día pendiente" : "días pendientes"} de registro esta semana
                            </span>
                            <span className="text-zinc-400">
                                Mantén tu adherencia completando tus calorías en el calendario.
                            </span>
                        </div>
                    </div>
                    {onGoToCalendar && (
                        <button
                            onClick={onGoToCalendar}
                            className="px-4 py-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-semibold rounded-full transition-all shrink-0 self-end sm:self-auto"
                        >
                            Ver en Calendario
                        </button>
                    )}
                </div>
            )}

            {/* Date Selector Header & Daily Caloric Telemetry */}
            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl">
                {/* Date Controls */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-5 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleShiftDate(-1)}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                            title="Día anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-white" />
                            <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                                {formatFriendlyDate(selectedDate)}
                            </span>
                            {isToday ? (
                                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono text-[10px] font-bold">
                                    HOY
                                </span>
                            ) : (
                                <button
                                    onClick={() => onSelectDate && onSelectDate(todayStr)}
                                    className="px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 font-mono text-[10px] transition-all"
                                >
                                    Ir a Hoy
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleShiftDate(1)}
                            disabled={isToday}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white/[0.04]"
                            title="Día siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-400">
                            Estado:{" "}
                            <span className={totals.totalCalories > 0 ? "text-[#10B981] font-semibold" : "text-zinc-500 font-normal"}>
                                {totals.totalCalories > 0 ? "Registro Activo" : "Sin Registrar (Nuevo Día)"}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Calorie Progress Bar & Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
                            TOTAL INGERIDO
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                                {totals.totalCalories.toLocaleString()}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">kcal</span>
                        </div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
                            OBJETIVO CALÓRICO
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                                {targetCalories.toLocaleString()}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">kcal</span>
                        </div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
                            BALANCE / DIFERENCIA
                        </span>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`text-2xl sm:text-3xl font-bold font-mono ${
                                totals.totalCalories === 0 
                                    ? "text-zinc-500" 
                                    : Math.abs(calorieDiff) <= 100 
                                    ? "text-[#10B981]" 
                                    : calorieDiff > 0 
                                    ? "text-[#F59E0B]" 
                                    : "text-zinc-300"
                            }`}>
                                {totals.totalCalories === 0 ? "0" : (calorieDiff > 0 ? `+${calorieDiff}` : calorieDiff)}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium">kcal</span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div>
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                        <span>Adherencia Calórica</span>
                        <span className="font-mono text-white font-semibold">{caloriePct}%</span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                caloriePct >= 95 && caloriePct <= 105
                                    ? "bg-[#10B981]"
                                    : caloriePct > 105
                                    ? "bg-[#F59E0B]"
                                    : "bg-white"
                            }`}
                            style={{ width: `${Math.min(100, caloriePct)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* 5 Meal Sections */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                            <Utensils size={16} /> REGISTRO DE COMIDAS DEL DÍA (5 TIEMPOS)
                        </h3>
                        <p className="text-xs text-zinc-400 font-normal">
                            Ingresa lo que comiste o toma foto a tu plato para que Argon calcule porciones y calorías al instante.
                        </p>
                    </div>

                    {/* Botón Principal Escanear Comida con Cámara */}
                    <button
                        onClick={() => {
                            setFoodScannerCategory(null);
                            setIsFoodScannerOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-2xl bg-[#10B981]/15 hover:bg-[#10B981] text-[#10B981] hover:text-black border border-[#10B981]/30 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-[#10B981]/10 self-start sm:self-auto shrink-0 group"
                        title="Tomar foto a tu plato de comida con la cámara para que Argon identifique porciones y calorías"
                    >
                        <Camera size={15} className="group-hover:scale-110 transition-transform" />
                        <span>Escanear Comida con IA</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {MEAL_CATEGORIES.map(category => {
                        const items = currentLog.meals[category.key] || [];
                        const catCalories = items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);
                        const isAdding = activeCategory === category.key;
                        const suggestedCal = Math.round(targetCalories * (category.suggestedPct / 100));

                        return (
                            <div
                                key={category.key}
                                className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.14] rounded-2xl p-4 sm:p-5 transition-all shadow-lg"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-xl">{category.iconEmoji}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-white tracking-tight">
                                                    {category.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-400 font-normal">
                                                    (Sugerido: ~{suggestedCal} kcal)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 font-normal">
                                                {category.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                                        <div className="text-right">
                                            <span className="text-sm font-bold font-mono text-white block">
                                                {catCalories} <span className="text-xs font-normal text-zinc-400">kcal</span>
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                {items.length} {items.length === 1 ? "alimento" : "alimentos"}
                                            </span>
                                        </div>

                                        {/* Botón Escáner Cámara para esta categoría */}
                                        <button
                                            onClick={() => {
                                                setFoodScannerCategory(category.key);
                                                setIsFoodScannerOpen(true);
                                            }}
                                            className="px-2.5 py-1.5 bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                                            title={`Tomar foto con la cámara para ${category.title}`}
                                        >
                                            <Camera size={13} />
                                            <span className="hidden sm:inline">Foto IA</span>
                                        </button>

                                        {dietPlan && (
                                            <button
                                                onClick={() => handlePrefillFromPlan(category.key)}
                                                className="px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/[0.08] rounded-xl text-[11px] font-medium transition-all flex items-center gap-1"
                                                title="Cargar del plan de IA generado"
                                            >
                                                <Sparkles size={12} className="text-zinc-400" />
                                                <span className="hidden sm:inline">Del Plan IA</span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (isAdding) {
                                                    setActiveCategory(null);
                                                } else {
                                                    setActiveCategory(category.key);
                                                    setFoodName("");
                                                    setFoodCalories("");
                                                    setFoodProtein("");
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                                                isAdding
                                                    ? "bg-white/[0.1] text-white"
                                                    : "bg-white hover:bg-zinc-200 text-black shadow-xs"
                                            }`}
                                        >
                                            <Plus size={13} />
                                            <span>{isAdding ? "Cerrar" : "Agregar"}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Items list */}
                                {items.length > 0 ? (
                                    <div className="space-y-2 mb-3">
                                        {items.map(item => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs group"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                                                    <span className="text-white font-medium truncate">{item.name}</span>
                                                    {item.proteinG ? (
                                                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                                            ({item.proteinG}g P)
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                                    <span className="font-mono font-semibold text-white text-xs">
                                                        {item.calories} kcal
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveFood(category.key, item.id)}
                                                        className="text-zinc-500 hover:text-[#FF2A2A] p-1 rounded-md transition-colors"
                                                        title="Eliminar alimento"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    !isAdding && (
                                        <p className="text-[11px] text-zinc-500 py-1 font-normal italic">
                                            No has registrado alimentos en {category.title.toLowerCase()}. Presiona "+ Agregar".
                                        </p>
                                    )
                                )}

                                {/* Inline Add Form */}
                                {isAdding && (
                                    <div className="mt-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-xl space-y-2.5 animate-fadeIn">
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                                            <div className="sm:col-span-6">
                                                <input
                                                    type="text"
                                                    placeholder="¿Qué comiste? Ej. 3 huevos + 60g avena"
                                                    value={foodName}
                                                    onChange={e => setFoodName(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") handleAddFood(category.key);
                                                    }}
                                                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 text-xs outline-none focus:border-white/40"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <input
                                                    type="number"
                                                    placeholder="Calorías (kcal)"
                                                    value={foodCalories}
                                                    onChange={e => setFoodCalories(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") handleAddFood(category.key);
                                                    }}
                                                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 font-mono text-xs outline-none focus:border-white/40"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <input
                                                    type="number"
                                                    placeholder="Proteína (g opcional)"
                                                    value={foodProtein}
                                                    onChange={e => setFoodProtein(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === "Enter") handleAddFood(category.key);
                                                    }}
                                                    className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 font-mono text-xs outline-none focus:border-white/40"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setActiveCategory(null)}
                                                className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAddFood(category.key)}
                                                className="px-4 py-1.5 bg-white text-black font-semibold text-xs rounded-xl shadow-xs hover:bg-zinc-200 transition-all"
                                            >
                                                Guardar Alimento
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Daily Supplements Checklist (Interactive per day) */}
            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Pill size={18} className="text-white" />
                        <div>
                            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                                REGISTRO DE SUPLEMENTACIÓN DEL DÍA
                            </h4>
                            <p className="text-xs text-zinc-400 font-normal">
                                Marca los suplementos que has consumido hoy para garantizar saturación.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] font-mono text-xs text-zinc-300">
                            <span className="font-bold text-white">{supplementsTakenCount}</span> / {supplementsCount} Tomados
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {supplements.map((sup, idx) => {
                        const isTaken = !!currentLog.supplementsTaken?.[sup.name];

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleToggleSupplement(sup.name)}
                                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 active:scale-[0.98] ${
                                    isTaken
                                        ? "bg-white/[0.08] border-white/30 text-white shadow-md"
                                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/10 hover:text-zinc-200"
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                    isTaken ? "bg-white text-black" : "border border-zinc-600 bg-black/40"
                                }`}>
                                    {isTaken ? <Check size={13} strokeWidth={3} /> : null}
                                </div>

                                <div className="min-w-0">
                                    <h5 className={`font-bold text-xs tracking-tight ${isTaken ? "text-white" : "text-zinc-200"}`}>
                                        {sup.name}
                                    </h5>
                                    <p className="text-xs font-mono font-semibold text-zinc-400 mt-0.5">
                                        {sup.dosage}
                                    </p>
                                    <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                                        Momento: {sup.timing}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modal de Escáner de Comida con Cámara & Argon AI */}
            <FoodCameraScannerModal
                isOpen={isFoodScannerOpen}
                onClose={() => setIsFoodScannerOpen(false)}
                initialCategory={foodScannerCategory}
                onAddFoodItem={handleAddScannedFood}
            />
        </div>
    );
};
