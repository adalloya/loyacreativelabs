// src/components/apex/v2/ApexCalendarSyncModal.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar as CalendarIcon,
    X,
    ExternalLink,
    Download,
    Check,
    Clock,
    Sparkles,
    CalendarPlus
} from "lucide-react";
import {
    CalendarEvent,
    createGoogleCalendarUrl,
    createOutlookCalendarUrl,
    downloadIcsCalendar,
    buildDailyMealCalendarEvent,
    buildIndividualMealCalendarEvents,
    buildWeeklyMealCalendarEvents
} from "@/lib/calendar-export";
import { getInitialTheme, Theme } from "@/lib/theme";

interface ApexCalendarSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    dietPlan?: any;
    activeDate: string;
    selectedDayIndex: number;
    targetCalories: number;
}

export const ApexCalendarSyncModal: React.FC<ApexCalendarSyncModalProps> = ({
    isOpen,
    onClose,
    dietPlan,
    activeDate,
    selectedDayIndex,
    targetCalories
}) => {
    const [exportScope, setExportScope] = useState<"day" | "week">("day");
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const currentDayName = DAY_NAMES[selectedDayIndex] || "Día Seleccionado";

    const dayMeals = (dietPlan?.thirtyDayPlan?.[selectedDayIndex]?.meals)
        || (dietPlan?.weeklyTemplates?.[0]?.meals)
        || [];

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    if (!isOpen) return null;

    // Acción: Google Calendar (Gmail)
    const handleGoogleCalendar = () => {
        if (dayMeals.length === 0) return;

        // Si exportScope es día, creamos el evento consolidado del día seleccionado
        const dailyEvent = buildDailyMealCalendarEvent(
            currentDayName,
            activeDate,
            dayMeals,
            dietPlan?.caloriesTarget || targetCalories
        );

        const url = createGoogleCalendarUrl(dailyEvent);
        window.open(url, "_blank", "noopener,noreferrer");
        showToast("✓ Abriendo Google Calendar...");
    };

    // Acción: Outlook (Microsoft)
    const handleOutlookCalendar = () => {
        if (dayMeals.length === 0) return;

        const dailyEvent = buildDailyMealCalendarEvent(
            currentDayName,
            activeDate,
            dayMeals,
            dietPlan?.caloriesTarget || targetCalories
        );

        const url = createOutlookCalendarUrl(dailyEvent);
        window.open(url, "_blank", "noopener,noreferrer");
        showToast("✓ Abriendo Outlook Calendar...");
    };

    // Acción: Descargar archivo .ics (Semana o Día)
    const handleDownloadIcs = () => {
        if (exportScope === "week") {
            const allDays = dietPlan?.thirtyDayPlan || dietPlan?.weeklyTemplates || [{ meals: dayMeals }];
            const events = buildWeeklyMealCalendarEvents(activeDate, allDays);
            downloadIcsCalendar(events, "apex_plan_semanal_completo.ics");
            showToast("✓ Archivo .ics descargado (Semana Completa)");
        } else {
            const events = buildIndividualMealCalendarEvents(activeDate, dayMeals);
            downloadIcsCalendar(events, `apex_plan_${currentDayName.toLowerCase()}.ics`);
            showToast(`✓ Archivo .ics descargado (${currentDayName})`);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="relative w-full max-w-lg bg-zinc-950 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 text-white max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                                <CalendarPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                                    Agregar a mi Calendario Personal
                                </h3>
                                <p className="text-[11px] text-zinc-400 font-mono">
                                    Gmail • Google Calendar • Outlook • Apple
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Toast de Confirmación Inline */}
                    {toastMessage && (
                        <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
                            <span>{toastMessage}</span>
                        </div>
                    )}

                    {/* Selector de Alcance: Día vs Semana */}
                    <div className="mb-4">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                            ¿Qué deseas agendar?
                        </label>
                        <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/60 border border-white/10">
                            <button
                                type="button"
                                onClick={() => setExportScope("day")}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    exportScope === "day"
                                        ? "bg-white text-black shadow-md"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                {currentDayName} ({dayMeals.length} comidas)
                            </button>
                            <button
                                type="button"
                                onClick={() => setExportScope("week")}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    exportScope === "week"
                                        ? "bg-white text-black shadow-md"
                                        : "text-zinc-400 hover:text-white"
                                }`}
                            >
                                Semana Completa (7 Días)
                            </button>
                        </div>
                    </div>

                    {/* Botones Principales de Servicios de Calendario */}
                    <div className="space-y-2.5 mb-5">
                        {/* 1. Google Calendar / Gmail */}
                        <button
                            type="button"
                            onClick={handleGoogleCalendar}
                            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-lg shadow-blue-600/20 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
                                    G
                                </span>
                                <div className="text-left">
                                    <div className="leading-tight">Google Calendar / Gmail</div>
                                    <div className="text-[10px] font-mono text-blue-100 font-normal">
                                        Agendar {exportScope === "day" ? currentDayName : "día activo"} con un toque
                                    </div>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-80" />
                        </button>

                        {/* 2. Outlook / Microsoft */}
                        <button
                            type="button"
                            onClick={handleOutlookCalendar}
                            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-700 hover:from-sky-500 hover:to-cyan-600 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 shadow-lg shadow-sky-600/20 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
                                    O
                                </span>
                                <div className="text-left">
                                    <div className="leading-tight">Outlook (Microsoft 365 / Live)</div>
                                    <div className="text-[10px] font-mono text-sky-100 font-normal">
                                        Abrir en Outlook Web para guardar
                                    </div>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-80" />
                        </button>

                        {/* 3. Archivo .ics para Sincronización Total */}
                        <button
                            type="button"
                            onClick={handleDownloadIcs}
                            className="w-full p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-98 cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Download className="w-4 h-4" />
                                </span>
                                <div className="text-left">
                                    <div className="leading-tight">
                                        Descargar archivo .ics {exportScope === "week" ? "(7 Días Completos)" : `(${currentDayName})`}
                                    </div>
                                    <div className="text-[10px] font-mono text-zinc-400 font-normal">
                                        Compatible con Apple Calendar, Google, Outlook Desktop
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                                .ics
                            </span>
                        </button>
                    </div>

                    {/* Vista Previa de Comidas y Horarios que se agendarán */}
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pb-1.5 border-b border-white/5">
                            <span>Resumen de Comidas: {currentDayName}</span>
                            <span className="text-emerald-400 font-bold">
                                ~{dietPlan?.caloriesTarget || targetCalories} kcal
                            </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {dayMeals.map((m: any, idx: number) => {
                                const mealName = m.mealName || m.name || `Comida ${idx + 1}`;
                                const timing = m.timing || `0${idx * 3 + 8}:00`;
                                const cals = m.calories || Math.round(((m.macros?.proteinG || 0) * 4) + ((m.macros?.carbsG || 0) * 4) + ((m.macros?.fatsG || 0) * 9)) || 0;
                                const protein = m.proteinG || m.macros?.proteinG || 0;

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-black/40 border border-white/5"
                                    >
                                        <div className="flex items-center gap-2 truncate pr-2">
                                            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                            <span className="font-mono text-[10px] text-zinc-400 shrink-0">{timing}</span>
                                            <span className="truncate text-zinc-200">{mealName}</span>
                                        </div>
                                        <div className="font-mono text-[10px] text-zinc-400 shrink-0">
                                            {cals} kcal • {protein}g P
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
