import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    Layers,
    Flame,
    Dumbbell,
    HeartPulse,
    CheckCircle2,
    Sparkles,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import {
    ReadinessState,
    DailyCardioEntry,
    CARDIO_PROTOCOLS
} from "@/lib/hypertrophy-engine";

export interface ApexV2WorkoutDashboardProps {
    routineTitle?: string;
    routineFocus?: string;
    completedExercisesCount: number;
    totalExercisesCount: number;
    completedSetsCount: number;
    totalSets: number;
    percent: number;
    burnedKcal: number;
    totalVolume: number;
    weightUnit: "lbs" | "kg";
    isFinished: boolean;
    todayCardio?: DailyCardioEntry;
    onOpenCardioModal?: () => void;
    onOpenLoadEvolution?: () => void;
    readiness: ReadinessState;
    onChangeReadiness?: (r: ReadinessState) => void;
    isLight: boolean;
    athleteName?: string;
}

export const ApexV2WorkoutDashboard: React.FC<ApexV2WorkoutDashboardProps> = ({
    routineTitle,
    routineFocus,
    completedExercisesCount,
    totalExercisesCount,
    completedSetsCount,
    totalSets,
    percent,
    burnedKcal,
    totalVolume,
    weightUnit,
    isFinished,
    todayCardio,
    onOpenCardioModal,
    onOpenLoadEvolution,
    readiness,
    onChangeReadiness,
    isLight,
    athleteName
}) => {
    // Estado de contracción: Por defecto contraído siempre
    const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
    const activeCollapsed = isCollapsed;
    // Parámetros para el círculo de progreso SVG
    const radius = 44;
    const strokeWidth = 8.5;
    const circumference = 2 * Math.PI * radius; // ~276.46
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

    const isCardioActive = Boolean(todayCardio && todayCardio.type !== "none");
    const isCardioDone = Boolean(isCardioActive && todayCardio?.completed);

    const formattedVolume = new Intl.NumberFormat("es-MX").format(totalVolume);

    // Limpieza estricta de emojis en textos dinámicos
    const cleanTitle = (routineTitle || "Entrenamiento del Día")
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
        .trim();
    const cleanFocus = (routineFocus || "Hipertrofia & Rendimiento")
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "")
        .trim();

    // Si está contraído (por defecto o cuando el usuario lo contrajo manualmente):
    if (activeCollapsed) {
        return (
            <div className={`relative rounded-3xl p-4 sm:p-5 backdrop-blur-2xl border transition-all overflow-hidden select-none shadow-xl ${
                isLight
                    ? isFinished
                        ? "bg-white/95 border-emerald-300 shadow-slate-900/[0.04] text-slate-900"
                        : "bg-white/95 border-slate-200/90 shadow-slate-900/[0.04] text-slate-900"
                    : isFinished
                        ? "bg-zinc-950/85 border-emerald-500/25 shadow-2xl text-white"
                        : "bg-zinc-950/85 border-white/10 shadow-2xl text-white"
            }`}>
                {/* Resplandor ambiental de éxito o progreso */}
                <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20 ${
                    isFinished ? "bg-emerald-500" : percent > 0 ? "bg-teal-500" : "bg-blue-500"
                }`} />

                {/* Cabecera del Resumen: Mensaje de felicitaciones (solo si terminó) o estado actual de la rutina */}
                <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Indicador visual a la izquierda: Check si terminó, círculo de progreso si está en curso */}
                        {isFinished ? (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-500 shadow-sm">
                                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                            </div>
                        ) : (
                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border relative ${
                                isLight
                                    ? "bg-slate-100 text-slate-800 border-slate-200"
                                    : "bg-white/[0.05] text-white border-white/10"
                            }`}>
                                <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="13.5"
                                        className={isLight ? "text-slate-200" : "text-white/10"}
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="13.5"
                                        className={percent > 0 ? "text-emerald-500" : "text-zinc-600"}
                                        strokeWidth="3.5"
                                        strokeDasharray={2 * Math.PI * 13.5}
                                        strokeDashoffset={2 * Math.PI * 13.5 - (Math.min(100, Math.max(0, percent)) / 100) * (2 * Math.PI * 13.5)}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-mono font-bold">
                                    {percent}%
                                </span>
                            </div>
                        )}

                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                    isFinished
                                        ? (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30")
                                        : percent > 0
                                        ? (isLight ? "bg-teal-50 text-teal-700 border-teal-300" : "bg-teal-500/15 text-teal-400 border-teal-500/30")
                                        : (isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.06] text-zinc-400 border-white/10")
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${
                                        isFinished ? "bg-emerald-500 animate-pulse" : percent > 0 ? "bg-teal-400 animate-pulse" : "bg-zinc-500"
                                    }`} />
                                    {isFinished ? "RUTINA COMPLETADA" : percent > 0 ? `${percent}% AVANCE` : "POR INICIAR"}
                                </span>
                                {isFinished && (
                                    <span className={`text-[11px] font-mono font-bold ${
                                        isLight ? "text-emerald-700" : "text-emerald-400"
                                    }`}>
                                        100%
                                    </span>
                                )}
                            </div>

                            {/* El mensaje de felicidades solo aparece cuando se completan todos los ejercicios */}
                            {isFinished ? (
                                <h3 className={`text-base sm:text-lg font-bold tracking-tight mt-0.5 truncate flex items-center gap-1.5 ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>¡Felicidades{athleteName ? `, ${athleteName}` : ""}!</span>
                                </h3>
                            ) : (
                                <h3 className={`text-base sm:text-lg font-bold tracking-tight mt-0.5 truncate ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    {cleanTitle || "Entrenamiento del Día"}
                                </h3>
                            )}

                            <p className={`text-[11px] truncate ${
                                isLight ? "text-slate-600" : "text-zinc-400"
                            }`}>
                                {isFinished
                                    ? `Completaste tu rutina de hoy (${cleanTitle})`
                                    : `${completedExercisesCount} de ${totalExercisesCount} ejercicios completados`}
                            </p>
                        </div>
                    </div>

                    {/* Acciones del Header: Evolución Carga + Botón Ver detalles */}
                    <div className="flex items-center gap-2 shrink-0">
                        {onOpenLoadEvolution && (
                            <button
                                type="button"
                                onClick={onOpenLoadEvolution}
                                className={`hidden xs:flex px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold items-center gap-1.5 transition-all cursor-pointer border active:scale-95 ${
                                    isLight
                                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                                        : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/10"
                                }`}
                                title="Ver gráfica interactiva de evolución de carga"
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="hidden sm:inline">Evolución</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsCollapsed(false)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 ${
                                isLight
                                    ? "bg-slate-900 hover:bg-black text-white border-slate-900 shadow-sm"
                                    : "bg-white hover:bg-zinc-200 text-black border-white shadow-sm"
                            }`}
                            title="Expandir dashboard completo"
                        >
                            <span>Ver detalles</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Pequeño Resumen de Métricas Clave (4 chips en 1 fila) */}
                <div className={`mt-3 pt-3 border-t grid grid-cols-2 xs:grid-cols-4 gap-2 relative z-10 ${
                    isLight ? "border-slate-200/80" : "border-white/[0.08]"
                }`}>
                    {/* Chip 1: Series Completadas */}
                    <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Layers className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">Series</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-500">{completedSetsCount}/{totalSets}</span>
                    </div>

                    {/* Chip 2: Calorías Quemadas */}
                    <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500/20" />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">Quemadas</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-500">~{burnedKcal} kcal</span>
                    </div>

                    {/* Chip 3: Tonelaje Total */}
                    <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <Dumbbell className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">Tonelaje</span>
                        </div>
                        <span className="text-xs font-mono font-bold truncate">{formattedVolume} {weightUnit}</span>
                    </div>

                    {/* Chip 4: Cardio */}
                    <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-1.5 ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center gap-1.5 min-w-0">
                            <HeartPulse className={`w-3.5 h-3.5 shrink-0 ${isCardioDone ? "text-emerald-500" : "text-zinc-400"}`} />
                            <span className="text-[10px] font-mono text-zinc-400 uppercase">Cardio</span>
                        </div>
                        <span className={`text-xs font-mono font-bold truncate ${isCardioDone ? "text-emerald-500" : ""}`}>
                            {isCardioDone ? "Listo" : isCardioActive ? `${todayCardio?.minutes}m` : "Descanso"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-3xl p-4 sm:p-5.5 backdrop-blur-2xl border transition-all overflow-hidden select-none shadow-xl ${
            isLight
                ? "bg-white/95 border-slate-200/90 shadow-slate-900/[0.04] text-slate-900"
                : "bg-zinc-950/80 border-white/10 shadow-2xl text-white"
        }`}>
            {/* Resplandor ambiental de fondo */}
            <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20 ${
                isFinished ? "bg-emerald-500" : percent > 0 ? "bg-teal-500" : "bg-blue-500"
            }`} />

            {/* Fila 1: Cabecera con Título, Estado, Botón de Evolución y Selector de Readiness */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-inherit/40 relative z-10">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status Badge */}
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 uppercase tracking-wider border ${
                            isFinished
                                ? (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30")
                                : percent > 0
                                ? (isLight ? "bg-teal-50 text-teal-700 border-teal-300" : "bg-teal-500/15 text-teal-400 border-teal-500/30")
                                : (isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.06] text-zinc-400 border-white/10")
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                isFinished ? "bg-emerald-500 animate-pulse" : percent > 0 ? "bg-teal-400 animate-ping" : "bg-zinc-500"
                            }`} />
                            {isFinished ? "RUTINA COMPLETADA" : percent > 0 ? "EN CURSO" : "POR INICIAR"}
                        </span>

                        <span className={`text-[11px] font-medium hidden xs:inline truncate ${
                            isLight ? "text-slate-500" : "text-zinc-400"
                        }`}>
                            {cleanFocus || "Hipertrofia & Rendimiento"}
                        </span>
                    </div>

                    <h2 className={`text-base sm:text-lg font-bold tracking-tight uppercase truncate ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        {isFinished
                            ? `¡Felicidades${athleteName ? `, ${athleteName}` : ""}!`
                            : cleanTitle || "Entrenamiento del Día"}
                    </h2>
                </div>

                {/* Acciones Derecha: Botón Contraer + Botón Evolución de Carga + Selector Readiness */}
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                    <button
                        type="button"
                        onClick={() => setIsCollapsed(true)}
                        className={`px-3 py-1.5 rounded-2xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shadow-xs ${
                            isLight
                                ? "bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-300"
                                : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 border-white/10"
                        }`}
                        title="Contraer a resumen compacto"
                    >
                        <span>Contraer</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {onOpenLoadEvolution && (
                        <button
                            type="button"
                            onClick={onOpenLoadEvolution}
                            className={`px-3 py-1.5 rounded-2xl text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border active:scale-95 shadow-xs ${
                                isLight
                                    ? "bg-slate-100/90 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700 border-slate-300 hover:border-emerald-300"
                                    : "bg-white/[0.06] hover:bg-emerald-500/15 text-zinc-200 hover:text-emerald-300 border-white/10 hover:border-emerald-500/30"
                            }`}
                            title="Ver gráfica interactiva de evolución de carga y 1RM"
                        >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Evolución Carga</span>
                        </button>
                    )}

                    {/* Selector Rápido de Fatiga / Readiness Integrado en el Dashboard */}
                    {onChangeReadiness && (
                        <div className={`inline-flex items-center gap-1 rounded-2xl p-1 border ${
                            isLight ? "bg-slate-100/80 border-slate-200" : "bg-black/50 border-white/10"
                        }`}>
                            {(["optimal", "normal", "fatigued"] as ReadinessState[]).map((r) => {
                                const isSel = readiness === r;
                                const labels = { optimal: "Óptimo", normal: "Normal", fatigued: "Fatigado" };
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => onChangeReadiness(r)}
                                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono uppercase font-bold transition-all cursor-pointer ${
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
                    )}
                </div>
            </div>

            {/* Fila 2: Centro de Comando - Círculo de Progreso + Rejilla de 4 KPIs */}
            <div className="pt-4 flex flex-col md:flex-row items-center gap-5 relative z-10">
                {/* 1. Círculo Radial de Progreso (SVG Gauge) */}
                <div className="flex flex-col items-center justify-center shrink-0">
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                            <defs>
                                <linearGradient id="apexRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10B981" />
                                    <stop offset="60%" stopColor="#14B8A6" />
                                    <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                                <linearGradient id="apexRingCompleteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#10B981" />
                                    <stop offset="100%" stopColor="#34D399" />
                                </linearGradient>
                            </defs>

                            {/* Pista de fondo */}
                            <circle
                                cx="55"
                                cy="55"
                                r={radius}
                                fill="transparent"
                                stroke={isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.07)"}
                                strokeWidth={strokeWidth}
                            />

                            {/* Barra de progreso animada */}
                            <motion.circle
                                cx="55"
                                cy="55"
                                r={radius}
                                fill="transparent"
                                stroke={isFinished ? "url(#apexRingCompleteGradient)" : "url(#apexRingGradient)"}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Contenido en el Centro del Círculo */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                            <span className={`text-2xl sm:text-3xl font-mono font-black tracking-tight leading-none ${
                                isFinished
                                    ? "text-emerald-500"
                                    : (isLight ? "text-slate-900" : "text-white")
                            }`}>
                                {percent}%
                            </span>
                            <span className={`text-[10px] font-mono font-bold mt-1 uppercase tracking-tight ${
                                isFinished ? "text-emerald-600 dark:text-emerald-400" : (isLight ? "text-slate-600" : "text-zinc-400")
                            }`}>
                                {completedExercisesCount}/{totalExercisesCount}
                            </span>
                            <span className={`text-[8px] uppercase tracking-wider font-sans leading-none ${
                                isLight ? "text-slate-500" : "text-zinc-500"
                            }`}>
                                ejercicios
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. Rejilla de 4 KPIs Clave del Entrenamiento */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full flex-1">
                    {/* KPI 1: Series Efectivas */}
                    <div className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isLight ? "bg-slate-50/80 border-slate-200/90" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                                isLight ? "text-slate-500" : "text-zinc-400"
                            }`}>
                                Series
                            </span>
                            <Layers className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        </div>
                        <div>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight ${
                                isLight ? "text-slate-900" : "text-white"
                            }`}>
                                {completedSetsCount}/{totalSets}
                            </span>
                            <span className={`text-[10px] font-mono block mt-0.5 ${
                                completedSetsCount >= totalSets && totalSets > 0
                                    ? "text-emerald-500 font-semibold"
                                    : (isLight ? "text-slate-500" : "text-zinc-500")
                            }`}>
                                {completedSetsCount >= totalSets && totalSets > 0
                                    ? "Completadas"
                                    : `${Math.max(0, totalSets - completedSetsCount)} restantes`}
                            </span>
                        </div>
                    </div>

                    {/* KPI 2: Calorías Quemadas */}
                    <div className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isLight ? "bg-slate-50/80 border-slate-200/90" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                                isLight ? "text-slate-500" : "text-zinc-400"
                            }`}>
                                Quemadas
                            </span>
                            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0 fill-amber-500/20" />
                        </div>
                        <div>
                            <span className="text-base sm:text-lg font-mono font-bold block leading-tight text-amber-500">
                                ~{burnedKcal} <span className="text-xs font-normal text-amber-500/80">kcal</span>
                            </span>
                            <span className={`text-[10px] font-mono block mt-0.5 truncate ${
                                isLight ? "text-slate-500" : "text-zinc-500"
                            }`}>
                                Fuerza {isCardioDone ? "+ Cardio" : ""}
                            </span>
                        </div>
                    </div>

                    {/* KPI 3: Volumen Total Levantado (Tonelaje) */}
                    <button
                        type="button"
                        onClick={onOpenLoadEvolution}
                        disabled={!onOpenLoadEvolution}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between text-left group ${
                            onOpenLoadEvolution ? "cursor-pointer active:scale-95" : "cursor-default"
                        } ${
                            isLight
                                ? "bg-slate-50/80 hover:bg-emerald-50/60 border-slate-200/90 hover:border-emerald-200"
                                : "bg-white/[0.03] hover:bg-emerald-500/10 border-white/[0.06] hover:border-emerald-500/30"
                        }`}
                        title={onOpenLoadEvolution ? "Toca para ver gráfica de evolución de carga y 1RM" : undefined}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                                isLight ? "text-slate-500 group-hover:text-emerald-700" : "text-zinc-400 group-hover:text-emerald-400"
                            }`}>
                                Tonelaje
                            </span>
                            <div className="flex items-center gap-1">
                                <Dumbbell className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {onOpenLoadEvolution && (
                                    <TrendingUp className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                )}
                            </div>
                        </div>
                        <div>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight truncate ${
                                isLight ? "text-slate-900 group-hover:text-emerald-950" : "text-white group-hover:text-emerald-200"
                            }`}>
                                {formattedVolume} <span className="text-xs font-normal opacity-70">{weightUnit}</span>
                            </span>
                            <span className={`text-[10px] font-mono flex items-center justify-between mt-0.5 ${
                                isLight ? "text-slate-500" : "text-zinc-500"
                            }`}>
                                <span>Carga total</span>
                                {onOpenLoadEvolution && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
                                        Ver gráfica
                                    </span>
                                )}
                            </span>
                        </div>
                    </button>

                    {/* KPI 4: Cardio Finisher */}
                    <button
                        type="button"
                        onClick={onOpenCardioModal}
                        disabled={!onOpenCardioModal}
                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer active:scale-95 group ${
                            isCardioDone
                                ? (isLight ? "bg-emerald-50/70 border-emerald-300 text-emerald-950" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300")
                                : isCardioActive
                                ? (isLight ? "bg-rose-50/70 hover:bg-rose-100/70 border-rose-200 text-rose-950" : "bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/25 text-rose-300")
                                : (isLight ? "bg-slate-50/80 border-slate-200/90 text-slate-800" : "bg-white/[0.03] border-white/[0.06] text-zinc-300")
                        }`}
                        title="Toca para abrir detalles de cardio"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                                isCardioDone
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : isCardioActive
                                    ? "text-rose-700 dark:text-rose-400"
                                    : (isLight ? "text-slate-500" : "text-zinc-400")
                            }`}>
                                Cardio Z2
                            </span>
                            <div className="flex items-center gap-0.5">
                                <HeartPulse className={`w-3.5 h-3.5 shrink-0 ${
                                    isCardioDone ? "text-emerald-500 animate-pulse" : isCardioActive ? "text-rose-500" : "text-zinc-400"
                                }`} />
                                <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                        <div>
                            <span className={`text-sm sm:text-base font-mono font-bold block leading-tight truncate ${
                                isCardioDone ? "text-emerald-600 dark:text-emerald-400" : (isLight ? "text-slate-900" : "text-white")
                            }`}>
                                {isCardioDone
                                    ? "Listo"
                                    : isCardioActive
                                    ? `${todayCardio?.minutes} min`
                                    : "Descanso"}
                            </span>
                            <span className={`text-[10px] font-mono block mt-0.5 truncate ${
                                isCardioDone
                                    ? "text-emerald-700/80 dark:text-emerald-400/80 font-semibold"
                                    : isCardioActive
                                    ? "text-rose-600 dark:text-rose-400 underline decoration-rose-500/40"
                                    : (isLight ? "text-slate-500" : "text-zinc-500")
                            }`}>
                                {isCardioDone
                                    ? `~${todayCardio?.caloriesBurned || 0} kcal`
                                    : isCardioActive
                                    ? "Abrir sesión"
                                    : "Sin cardio"}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
