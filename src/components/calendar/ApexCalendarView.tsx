"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Utensils,
    AlertCircle,
    CheckCircle2,
    Clock,
    Flame,
    ArrowRight,
    Activity,
    Layers,
    Plus,
    Check,
    HeartPulse
} from "lucide-react";
import {
    DailyNutritionLog,
    calculateDailyNutritionTotals,
    getLocalDateString,
    formatFriendlyDate,
    findPendingNutritionDates,
    MEAL_CATEGORIES
} from "@/lib/nutrition-tracker";
import { EXERCISE_DATABASE, CARDIO_PROTOCOLS, CardioType, DailyCardioEntry } from "@/lib/hypertrophy-engine";
import { localDb, ExerciseLog } from "@/lib/local-db";

interface ApexCalendarViewProps {
    targetCalories: number;
    allNutritionLogs: Record<string, DailyNutritionLog>;
    dailyCardio: Record<number, DailyCardioEntry>;
    onSelectDateForNutrition: (date: string) => void;
    onGoToGym: () => void;
}

export const ApexCalendarView: React.FC<ApexCalendarViewProps> = ({
    targetCalories,
    allNutritionLogs,
    dailyCardio,
    onSelectDateForNutrition,
    onGoToGym
}) => {
    const todayStr = useMemo(() => getLocalDateString(), []);
    const [selectedDate, setSelectedDate] = useState<string>(todayStr);

    // Month view state
    const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    // Workout logs for selected date from IndexedDB (Dexie)
    const [dayExerciseLogs, setDayExerciseLogs] = useState<ExerciseLog[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Fetch exercise logs whenever selectedDate changes
    useEffect(() => {
        let isMounted = true;
        setIsLoadingLogs(true);
        localDb.exercise_logs
            .where("workout_date")
            .equals(selectedDate)
            .toArray()
            .then(logs => {
                if (isMounted) {
                    setDayExerciseLogs(logs || []);
                    setIsLoadingLogs(false);
                }
            })
            .catch(err => {
                console.warn("[ApexCalendarView] Error loading logs:", err);
                if (isMounted) setIsLoadingLogs(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedDate]);

    // Check for pending past days
    const pendingDates = useMemo(() => {
        return findPendingNutritionDates(allNutritionLogs, 7);
    }, [allNutritionLogs]);

    // Selected Day Nutrition Data
    const selectedNutritionLog = allNutritionLogs[selectedDate];
    const nutritionTotals = useMemo(() => {
        return calculateDailyNutritionTotals(selectedNutritionLog);
    }, [selectedNutritionLog]);

    // Exercise summary calculation
    const exerciseSummary = useMemo(() => {
        if (!dayExerciseLogs || dayExerciseLogs.length === 0) {
            return {
                totalSets: 0,
                totalTonnage: 0,
                exercisesGrouped: [] as { exerciseId: string; name: string; sets: { setNumber: number; weight: number; reps: number }[] }[]
            };
        }

        const map = new Map<string, { setNumber: number; weight: number; reps: number }[]>();
        let totalTonnage = 0;

        for (const log of dayExerciseLogs) {
            const list = map.get(log.exercise_id) || [];
            list.push({
                setNumber: log.set_number,
                weight: log.weight_kg,
                reps: log.reps_completed
            });
            map.set(log.exercise_id, list);
            totalTonnage += (log.weight_kg * log.reps_completed);
        }

        const exercisesGrouped = Array.from(map.entries()).map(([exerciseId, sets]) => {
            const exerciseDef = EXERCISE_DATABASE.find(e => e.id === exerciseId);
            return {
                exerciseId,
                name: exerciseDef?.name || exerciseId.replace(/-/g, " ").toUpperCase(),
                sets: sets.sort((a, b) => a.setNumber - b.setNumber)
            };
        });

        return {
            totalSets: dayExerciseLogs.length,
            totalTonnage,
            exercisesGrouped
        };
    }, [dayExerciseLogs]);

    // Cardio data for selected date
    const selectedDateCardio: DailyCardioEntry | undefined = useMemo(() => {
        const byDate = Object.values(dailyCardio || {}).find(c => c?.date === selectedDate);
        if (byDate) return byDate;

        const [y, m, d] = selectedDate.split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        const jsDay = dateObj.getDay();
        const routineDayIndex = (jsDay + 6) % 7;
        return dailyCardio?.[routineDayIndex];
    }, [dailyCardio, selectedDate]);

    // Calendar Grid Days generation
    const calendarDays = useMemo(() => {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        // Monday start (0=Sun, 1=Mon, ..., 6=Sat) -> convert to 0=Mon, ..., 6=Sun
        let startingDayIndex = firstDayOfMonth.getDay() - 1;
        if (startingDayIndex === -1) startingDayIndex = 6;

        const totalDays = lastDayOfMonth.getDate();
        const daysArray: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

        // Previous month filler days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayIndex - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDay - i);
            daysArray.push({
                dateStr: getLocalDateString(d),
                dayNumber: prevMonthLastDay - i,
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(year, month, i);
            daysArray.push({
                dateStr: getLocalDateString(d),
                dayNumber: i,
                isCurrentMonth: true
            });
        }

        // Next month filler days to complete grid of 35 or 42
        const remaining = 35 - daysArray.length;
        if (remaining > 0) {
            for (let i = 1; i <= remaining; i++) {
                const d = new Date(year, month + 1, i);
                daysArray.push({
                    dateStr: getLocalDateString(d),
                    dayNumber: i,
                    isCurrentMonth: false
                });
            }
        }

        return daysArray;
    }, [currentMonthDate]);

    // Month navigation
    const handleShiftMonth = (direction: number) => {
        setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
    };

    const monthName = currentMonthDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const isToday = selectedDate === todayStr;
    const isPast = selectedDate < todayStr;
    const isFuture = selectedDate > todayStr;

    // Caloric Progress
    const caloriePct = targetCalories > 0 ? Math.min(100, Math.round((nutritionTotals.totalCalories / targetCalories) * 100)) : 0;

    return (
        <div className="space-y-6">
            {/* Pending dates alert banner */}
            {pendingDates.length > 0 && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0">
                            <AlertCircle size={16} />
                        </div>
                        <div>
                            <span className="font-bold text-white block">
                                Tienes {pendingDates.length} {pendingDates.length === 1 ? "día pendiente" : "días pendientes"} de registro
                            </span>
                            <span className="text-zinc-400">
                                Días anteriores sin registrar alimentación: {pendingDates.map(d => formatFriendlyDate(d)).join(", ")}. Selecciona el día para registrarlo.
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (pendingDates[0]) {
                                setSelectedDate(pendingDates[0]);
                                onSelectDateForNutrition(pendingDates[0]);
                            }
                        }}
                        className="px-4 py-2 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-semibold rounded-full transition-all shrink-0 self-end sm:self-auto"
                    >
                        Llenar Día Pendiente
                    </button>
                </div>
            )}

            {/* Calendar Grid Container */}
            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl">
                {/* Header Month Selector */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={18} className="text-white" />
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {capitalizedMonth}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedDate(todayStr)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isToday
                                    ? "bg-white text-black border-white"
                                    : "bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:text-white"
                            }`}
                        >
                            Hoy
                        </button>
                        <button
                            onClick={() => handleShiftMonth(-1)}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                            title="Mes anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => handleShiftMonth(1)}
                            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-zinc-300 hover:text-white transition-all"
                            title="Mes siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Day-of-week headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                </div>

                {/* Day Tiles Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {calendarDays.map((day, idx) => {
                        const isDaySelected = day.dateStr === selectedDate;
                        const isDayToday = day.dateStr === todayStr;
                        const isDayPast = day.dateStr < todayStr;

                        const dayNutrition = allNutritionLogs[day.dateStr];
                        const dayNutritionTotals = calculateDailyNutritionTotals(dayNutrition);
                        const hasNutrition = dayNutritionTotals.totalCalories > 0;
                        const isPending = isDayPast && !hasNutrition && pendingDates.includes(day.dateStr);

                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedDate(day.dateStr)}
                                className={`min-h-[64px] sm:min-h-[76px] p-2 rounded-2xl flex flex-col justify-between text-left transition-all relative border active:scale-[0.98] ${
                                    isDaySelected
                                        ? "bg-white text-black border-white shadow-xl z-10 font-bold"
                                        : isDayToday
                                        ? "bg-white/[0.08] text-white border-white/30"
                                        : day.isCurrentMonth
                                        ? "bg-white/[0.02] text-zinc-300 border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.12]"
                                        : "bg-black/20 text-zinc-600 border-transparent hover:bg-white/[0.02]"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-xs font-mono font-semibold ${
                                        isDaySelected ? "text-black" : isDayToday ? "text-white font-bold" : ""
                                    }`}>
                                        {day.dayNumber}
                                    </span>

                                    {isDayToday && !isDaySelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" title="Hoy" />
                                    )}
                                </div>

                                {/* Indicators inside day tile */}
                                <div className="w-full flex items-center justify-between gap-1 text-[10px] mt-1">
                                    {/* Nutrition Indicator */}
                                    {hasNutrition ? (
                                        <div className={`flex items-center gap-0.5 font-mono truncate ${
                                            isDaySelected ? "text-black font-semibold" : "text-[#10B981]"
                                        }`}>
                                            <Utensils size={9} />
                                            <span className="hidden sm:inline">{dayNutritionTotals.totalCalories}</span>
                                        </div>
                                    ) : isPending ? (
                                        <div className={`flex items-center gap-0.5 ${
                                            isDaySelected ? "text-amber-800" : "text-[#F59E0B]"
                                        }`} title="Falta registro nutricional">
                                            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                                        </div>
                                    ) : <div />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Telemetry Dashboard */}
            <div className="bg-[#121214]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-zinc-300 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] uppercase tracking-wide">
                                DÍA SELECCIONADO
                            </span>
                            {isToday && (
                                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 font-mono text-[10px] font-bold">
                                    HOY
                                </span>
                            )}
                            {isPast && (
                                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 font-mono text-[10px]">
                                    HISTÓRICO
                                </span>
                            )}
                            {isFuture && (
                                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-500 font-mono text-[10px]">
                                    PRÓXIMO
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            {formatFriendlyDate(selectedDate)}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onSelectDateForNutrition(selectedDate)}
                            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5"
                        >
                            <Utensils size={14} />
                            <span>{nutritionTotals.totalCalories > 0 ? "Editar Nutrición" : "Registrar Nutrición"}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SECTION 1: RESUMEN DE NUTRICIÓN */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <div className="flex items-center gap-2">
                                <Utensils size={16} className="text-white" />
                                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                                    RESUMEN DE NUTRICIÓN
                                </h3>
                            </div>
                            <span className="font-mono text-xs text-zinc-400">
                                {nutritionTotals.totalCalories > 0 ? `${nutritionTotals.totalItems} alimentos` : "Sin registro"}
                            </span>
                        </div>

                        {/* Calories Target vs Logged */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                                    OBJETIVO CALÓRICO
                                </span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {targetCalories.toLocaleString()} <span className="text-xs font-normal text-zinc-400">kcal</span>
                                </span>
                            </div>

                            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                                    TOTAL INGERIDO
                                </span>
                                <span className={`text-xl font-mono font-bold ${
                                    nutritionTotals.totalCalories > 0 ? "text-white" : "text-zinc-500"
                                }`}>
                                    {nutritionTotals.totalCalories.toLocaleString()} <span className="text-xs font-normal text-zinc-400">kcal</span>
                                </span>
                            </div>
                        </div>

                        {/* Calorie Bar */}
                        <div>
                            <div className="flex justify-between text-xs text-zinc-400 mb-1 font-medium">
                                <span>Progreso calórico</span>
                                <span className="font-mono text-white font-semibold">{caloriePct}%</span>
                            </div>
                            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
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

                        {/* Breakdown per 5 meals */}
                        <div className="space-y-2 pt-2">
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                DESGLOSE EN 5 TIEMPOS
                            </span>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                                {MEAL_CATEGORIES.map(cat => {
                                    const items = selectedNutritionLog?.meals?.[cat.key] || [];
                                    const cals = items.reduce((acc, i) => acc + (Number(i.calories) || 0), 0);

                                    return (
                                        <div
                                            key={cat.key}
                                            className="p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span>{cat.iconEmoji}</span>
                                                <span className="text-zinc-300 font-medium truncate">{cat.title}</span>
                                                <span className="text-[10px] text-zinc-500 font-normal">
                                                    ({items.length} {items.length === 1 ? "ítem" : "ítems"})
                                                </span>
                                            </div>
                                            <span className="font-mono text-white font-semibold">
                                                {cals} kcal
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action link */}
                        <button
                            onClick={() => onSelectDateForNutrition(selectedDate)}
                            className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>Ir al Módulo Nutricional de este Día</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>

                    {/* SECTION 2: RESUMEN DE EJERCICIOS REALIZADOS */}
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                            <div className="flex items-center gap-2">
                                <Dumbbell size={16} className="text-white" />
                                <h3 className="text-sm font-bold text-white tracking-tight uppercase">
                                    EJERCICIOS REALIZADOS
                                </h3>
                            </div>
                            <span className="font-mono text-xs text-zinc-400">
                                {exerciseSummary.totalSets > 0 ? `${exerciseSummary.totalSets} series registradas` : "Sin entrenar"}
                            </span>
                        </div>

                        {/* Exercise Metrics */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                                    SERIES COMPLETADAS
                                </span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {exerciseSummary.totalSets} <span className="text-xs font-normal text-zinc-400">series</span>
                                </span>
                            </div>

                            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block mb-1">
                                    TONELAJE TOTAL (KG)
                                </span>
                                <span className="text-xl font-mono font-bold text-white">
                                    {exerciseSummary.totalTonnage.toLocaleString()} <span className="text-xs font-normal text-zinc-400">kg</span>
                                </span>
                            </div>
                        </div>

                        {/* List of executed exercises */}
                        <div className="space-y-2 pt-2">
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                DETALLE POR EJERCICIO
                            </span>

                            {isLoadingLogs ? (
                                <p className="text-xs text-zinc-500 py-3 italic">Cargando registros...</p>
                            ) : exerciseSummary.exercisesGrouped.length > 0 ? (
                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                    {exerciseSummary.exercisesGrouped.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-xs space-y-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-white tracking-tight">
                                                    {item.name}
                                                </span>
                                                <span className="text-[11px] font-mono text-zinc-400">
                                                    {item.sets.length} series
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {item.sets.map((s, sIdx) => (
                                                    <span
                                                        key={sIdx}
                                                        className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md font-mono text-[10px] text-zinc-300"
                                                    >
                                                        S{s.setNumber}: {s.weight}kg × {s.reps}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-5 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-xl text-center space-y-2">
                                    <p className="text-xs text-zinc-400">
                                        No se encontraron registros de series en la base de datos para esta fecha.
                                    </p>
                                    <p className="text-[11px] text-zinc-500 font-normal">
                                        Día de descanso o pendiente de ejecución.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Cardio Finisher Summary for Selected Day */}
                        {selectedDateCardio && selectedDateCardio.type !== "none" && (
                            <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HeartPulse size={14} className={selectedDateCardio.completed ? "text-[#10B981]" : "text-[#FF2A2A]"} />
                                        <span className="font-semibold text-white tracking-tight">
                                            {CARDIO_PROTOCOLS[selectedDateCardio.type]?.label || "Cardio Zona 2"}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                                        selectedDateCardio.completed
                                            ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                                            : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
                                    }`}>
                                        {selectedDateCardio.completed ? "COMPLETADO" : "PROGRAMADO"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                    <div className="p-2 bg-black/30 rounded-lg border border-white/[0.04]">
                                        <span className="text-[9px] text-zinc-500 uppercase block">INCLINACIÓN</span>
                                        <span className="font-mono text-white font-bold">{selectedDateCardio.incline ?? 12}{CARDIO_PROTOCOLS[selectedDateCardio.type]?.inclineUnit || "%"}</span>
                                    </div>
                                    <div className="p-2 bg-black/30 rounded-lg border border-white/[0.04]">
                                        <span className="text-[9px] text-zinc-500 uppercase block">VELOCIDAD</span>
                                        <span className="font-mono text-white font-bold">{selectedDateCardio.speed ?? 4.8} <span className="text-[9px] font-normal text-zinc-400">{CARDIO_PROTOCOLS[selectedDateCardio.type]?.speedUnit || "km/h"}</span></span>
                                    </div>
                                    <div className="p-2 bg-black/30 rounded-lg border border-white/[0.04]">
                                        <span className="text-[9px] text-zinc-500 uppercase block">DURACIÓN</span>
                                        <span className="font-mono text-white font-bold">{selectedDateCardio.minutes} min</span>
                                    </div>
                                </div>

                                {selectedDateCardio.caloriesBurned ? (
                                    <div className="flex justify-between items-center text-[10px] text-zinc-400 pt-0.5 px-0.5">
                                        <span>Gasto metabólico estimado:</span>
                                        <span className="font-mono text-[#10B981] font-semibold">~{selectedDateCardio.caloriesBurned} kcal {selectedDateCardio.distanceKm ? `(${selectedDateCardio.distanceKm} km)` : ''}</span>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Action link */}
                        <button
                            onClick={onGoToGym}
                            className="w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <span>Ir a Sesión de Gimnasio</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
