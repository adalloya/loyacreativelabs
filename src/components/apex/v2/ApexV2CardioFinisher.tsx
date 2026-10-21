// src/components/apex/v2/ApexV2CardioFinisher.tsx
"use client";

import React from "react";
import {
    HeartPulse,
    CheckCircle2,
    Check,
    Flame,
    Activity,
    Timer,
    Gauge,
    Sparkles
} from "lucide-react";
import {
    CardioType,
    DailyCardioEntry,
    CARDIO_PROTOCOLS
} from "@/lib/hypertrophy-engine";

interface ApexV2CardioFinisherProps {
    todayCardio: DailyCardioEntry;
    onUpdateCardio: (updates: Partial<DailyCardioEntry> & { type?: CardioType }) => void;
    isLight: boolean;
}

export const ApexV2CardioFinisher: React.FC<ApexV2CardioFinisherProps> = ({
    todayCardio,
    onUpdateCardio,
    isLight
}) => {
    const activeProtocol = CARDIO_PROTOCOLS[todayCardio.type] || CARDIO_PROTOCOLS.incline_treadmill;

    return (
        <div className={`w-full rounded-3xl p-4 sm:p-6 backdrop-blur-2xl border shadow-xl transition-all space-y-4 select-none ${
            isLight
                ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-900/5"
                : "bg-zinc-950/75 border-white/10 text-white shadow-2xl"
        }`}>
            {/* Cabecera Principal */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b ${
                isLight ? "border-slate-200/80" : "border-white/[0.08]"
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                        todayCardio.completed
                            ? (isLight ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10")
                            : (isLight ? "bg-rose-50 text-rose-600 border-rose-200 shadow-sm" : "bg-rose-500/15 text-rose-400 border-rose-500/30")
                    }`}>
                        <HeartPulse size={22} className={todayCardio.completed ? "animate-pulse" : ""} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                isLight
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-white/[0.06] text-zinc-300 border-white/[0.08]"
                            }`}>
                                CARDIO ZONA 2 • FINAL DE SESIÓN
                            </span>
                            {todayCardio.completed && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                                    isLight
                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                }`}>
                                    <CheckCircle2 size={11} />
                                    COMPLETADO
                                </span>
                            )}
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold tracking-tight mt-0.5 ${
                            isLight ? "text-slate-950" : "text-white"
                        }`}>
                            {activeProtocol?.type || "Cardio Zona 2"}
                        </h3>
                    </div>
                </div>

                {todayCardio.type !== "none" && (
                    <button
                        type="button"
                        onClick={() => onUpdateCardio({ completed: !todayCardio.completed })}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 border ${
                            todayCardio.completed
                                ? (isLight
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                                    : "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20 font-bold")
                                : (isLight
                                    ? "bg-slate-900 hover:bg-black text-white border-slate-900 shadow-sm"
                                    : "bg-white hover:bg-zinc-200 text-black border-white shadow-md shadow-white/5")
                        }`}
                    >
                        <CheckCircle2 size={14} />
                        <span>{todayCardio.completed ? "CARDIO LOGRADO" : "MARCAR REALIZADO"}</span>
                    </button>
                )}
            </div>

            {/* Selector de Modalidad Diario (4 Opciones) */}
            <div className="space-y-2">
                <span className={`text-[11px] font-semibold block ${
                    isLight ? "text-slate-500" : "text-zinc-400"
                }`}>
                    Elige tu modalidad para hoy (ajustable al final del entrenamiento):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(["incline_treadmill", "stairmaster", "stationary_bike", "none"] as CardioType[]).map((key) => {
                        const isSelected = todayCardio.type === key;
                        const proto = CARDIO_PROTOCOLS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onUpdateCardio({ type: key })}
                                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer active:scale-98 flex flex-col justify-between ${
                                    isSelected
                                        ? (isLight
                                            ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                                            : "bg-white text-black border-white font-semibold shadow-lg shadow-white/10")
                                        : (isLight
                                            ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                                            : "bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border-white/[0.06]")
                                }`}
                            >
                                <div className="font-bold text-xs truncate">{proto?.label}</div>
                                <div className={`text-[10px] mt-1 font-mono ${
                                    isSelected
                                        ? (isLight ? "text-slate-300" : "text-zinc-700")
                                        : (isLight ? "text-slate-400" : "text-zinc-500")
                                }`}>
                                    {key === "none" ? "0 min • Descanso" : `${proto?.defaultMinutes} min rec.`}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Si eligió cardio: Controles de Inclinación, Velocidad, Tiempo y Telemetría */}
            {todayCardio.type !== "none" ? (
                <div className="space-y-4 pt-1">
                    {/* Paneles de Configuración en 3 Columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Inclinación / Pendiente */}
                        <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
                            isLight ? "bg-slate-50/70 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Activity className={`w-3.5 h-3.5 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                        isLight ? "text-slate-600" : "text-zinc-400"
                                    }`}>
                                        {activeProtocol?.inclineLabel || "Inclinación"}
                                    </span>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                                    isLight
                                        ? "bg-white text-slate-900 border-slate-200 shadow-xs"
                                        : "bg-white/[0.06] text-white border-white/[0.08]"
                                }`}>
                                    {activeProtocol?.inclineUnit || "%"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({
                                        incline: Math.max(0, Math.round((todayCardio.incline - (activeProtocol?.inclineStep || 0.5)) * 10) / 10)
                                    })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
                                >
                                    -
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        step={activeProtocol?.inclineStep || 0.5}
                                        min="0"
                                        max="30"
                                        value={todayCardio.incline}
                                        onChange={(e) => onUpdateCardio({ incline: parseFloat(e.target.value) || 0 })}
                                        className={`w-full text-center rounded-xl py-2 px-2 font-mono text-base font-bold border focus:outline-none transition-all ${
                                            isLight
                                                ? "bg-white border-slate-200 text-slate-900 focus:border-slate-900 shadow-xs"
                                                : "bg-black/40 border-white/[0.1] text-white focus:border-white/40"
                                        }`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({
                                        incline: Math.round((todayCardio.incline + (activeProtocol?.inclineStep || 0.5)) * 10) / 10
                                    })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
                                >
                                    +
                                </button>
                            </div>

                            {/* Presets de Inclinación */}
                            {(activeProtocol?.inclinePresets?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                    <span className={`text-[10px] mr-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Presets:</span>
                                    {activeProtocol?.inclinePresets?.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => onUpdateCardio({ incline: val })}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border cursor-pointer active:scale-95 ${
                                                todayCardio.incline === val
                                                    ? (isLight ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-white text-black border-white font-bold")
                                                    : (isLight ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-100" : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white")
                                            }`}
                                        >
                                            {val}{activeProtocol?.inclineUnit}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Velocidad / Cadencia */}
                        <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
                            isLight ? "bg-slate-50/70 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Gauge className={`w-3.5 h-3.5 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                        isLight ? "text-slate-600" : "text-zinc-400"
                                    }`}>
                                        {activeProtocol?.speedLabel || "Velocidad"}
                                    </span>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                                    isLight
                                        ? "bg-white text-slate-900 border-slate-200 shadow-xs"
                                        : "bg-white/[0.06] text-white border-white/[0.08]"
                                }`}>
                                    {activeProtocol?.speedUnit || "km/h"}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({
                                        speed: Math.max(0.5, Math.round((todayCardio.speed - (activeProtocol?.speedStep || 0.1)) * 10) / 10)
                                    })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
                                >
                                    -
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        step={activeProtocol?.speedStep || 0.1}
                                        min="0.5"
                                        max="30"
                                        value={todayCardio.speed}
                                        onChange={(e) => onUpdateCardio({ speed: parseFloat(e.target.value) || 0 })}
                                        className={`w-full text-center rounded-xl py-2 px-2 font-mono text-base font-bold border focus:outline-none transition-all ${
                                            isLight
                                                ? "bg-white border-slate-200 text-slate-900 focus:border-slate-900 shadow-xs"
                                                : "bg-black/40 border-white/[0.1] text-white focus:border-white/40"
                                        }`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({
                                        speed: Math.round((todayCardio.speed + (activeProtocol?.speedStep || 0.1)) * 10) / 10
                                    })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
                                >
                                    +
                                </button>
                            </div>

                            {/* Presets de Velocidad */}
                            {(activeProtocol?.speedPresets?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                    <span className={`text-[10px] mr-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Presets:</span>
                                    {activeProtocol?.speedPresets?.map((val) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => onUpdateCardio({ speed: val })}
                                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border cursor-pointer active:scale-95 ${
                                                todayCardio.speed === val
                                                    ? (isLight ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-white text-black border-white font-bold")
                                                    : (isLight ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-100" : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white")
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. Tiempo / Duración */}
                        <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-2.5 ${
                            isLight ? "bg-slate-50/70 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                        }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Timer className={`w-3.5 h-3.5 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                        isLight ? "text-slate-600" : "text-zinc-400"
                                    }`}>
                                        Tiempo
                                    </span>
                                </div>
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                                    isLight
                                        ? "bg-white text-slate-900 border-slate-200 shadow-xs"
                                        : "bg-white/[0.06] text-white border-white/[0.08]"
                                }`}>
                                    min
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({ minutes: Math.max(5, todayCardio.minutes - 5) })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
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
                                        onChange={(e) => onUpdateCardio({ minutes: parseInt(e.target.value, 10) || 0 })}
                                        className={`w-full text-center rounded-xl py-2 px-2 font-mono text-base font-bold border focus:outline-none transition-all ${
                                            isLight
                                                ? "bg-white border-slate-200 text-slate-900 focus:border-slate-900 shadow-xs"
                                                : "bg-black/40 border-white/[0.1] text-white focus:border-white/40"
                                        }`}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onUpdateCardio({ minutes: todayCardio.minutes + 5 })}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base transition-all active:scale-95 shrink-0 cursor-pointer border ${
                                        isLight
                                            ? "bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs"
                                            : "bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/[0.08]"
                                    }`}
                                >
                                    +
                                </button>
                            </div>

                            {/* Presets de Tiempo */}
                            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                                <span className={`text-[10px] mr-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>Presets:</span>
                                {[15, 20, 25, 30, 45].map((mins) => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => onUpdateCardio({ minutes: mins })}
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all border cursor-pointer active:scale-95 ${
                                            todayCardio.minutes === mins
                                                ? (isLight ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-white text-black border-white font-bold")
                                                : (isLight ? "bg-white text-slate-600 border-slate-200 hover:bg-slate-100" : "bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white")
                                        }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Telemetría Dinámica en Vivo: Gasto Calórico, Distancia, BPM y Zona */}
                    <div className={`p-3.5 sm:p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center ${
                        isLight ? "bg-slate-100/60 border-slate-200/80" : "bg-white/[0.02] border-white/[0.06]"
                    }`}>
                        <div className={`p-2.5 rounded-xl border ${
                            isLight ? "bg-white border-slate-200/80 shadow-xs" : "bg-black/30 border-white/[0.04]"
                        }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <Flame className="w-3 h-3 text-rose-500" />
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    CALORÍAS EST.
                                </span>
                            </div>
                            <span className={`text-sm sm:text-base font-mono font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                ~{todayCardio.caloriesBurned}{" "}
                                <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>kcal</span>
                            </span>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${
                            isLight ? "bg-white border-slate-200/80 shadow-xs" : "bg-black/30 border-white/[0.04]"
                        }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <Activity className="w-3 h-3 text-cyan-500" />
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    DISTANCIA EST.
                                </span>
                            </div>
                            <span className={`text-sm sm:text-base font-mono font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                {todayCardio.distanceKm}{" "}
                                <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>km</span>
                            </span>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${
                            isLight ? "bg-white border-slate-200/80 shadow-xs" : "bg-black/30 border-white/[0.04]"
                        }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <HeartPulse className="w-3 h-3 text-emerald-500" />
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    FRECUENCIA
                                </span>
                            </div>
                            <span className="text-sm sm:text-base font-mono font-bold text-emerald-500">
                                120-140{" "}
                                <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>BPM</span>
                            </span>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${
                            isLight ? "bg-white border-slate-200/80 shadow-xs" : "bg-black/30 border-white/[0.04]"
                        }`}>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${
                                    isLight ? "text-slate-500" : "text-zinc-500"
                                }`}>
                                    ZONA METABÓLICA
                                </span>
                            </div>
                            <span className={`text-sm sm:text-base font-mono font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                                Zona 2{" "}
                                <span className={`text-[10px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>(mTOR Safe)</span>
                            </span>
                        </div>
                    </div>

                    {/* Protocol Details & Scientific Cue */}
                    <div className={`p-3.5 rounded-2xl border space-y-1 ${
                        isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <p className={`text-xs leading-relaxed font-medium ${
                            isLight ? "text-slate-700" : "text-zinc-300"
                        }`}>
                            {activeProtocol?.protocol}
                        </p>
                        <p className={`text-[10px] font-mono ${
                            isLight ? "text-slate-400" : "text-zinc-500"
                        }`}>
                            Zona 2: Estimulación mitocondrial aeróbica sin interferir en la vía mTOR de hipertrofia muscular.
                        </p>
                    </div>

                    {/* Guardar Datos de Cardio */}
                    <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
                        <div className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                            {todayCardio.savedAt ? (
                                <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                                    <Check size={14} />
                                    Guardado en tu historial ({new Date(todayCardio.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                                </span>
                            ) : (
                                <span>Ajusta inclinación, velocidad y tiempo, luego pulsa guardar.</span>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => onUpdateCardio({ completed: true })}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border ${
                                isLight
                                    ? "bg-slate-900 hover:bg-black text-white border-slate-900 shadow-md shadow-slate-900/10"
                                    : "bg-white hover:bg-zinc-200 text-black border-white shadow-lg shadow-white/5"
                            }`}
                        >
                            <CheckCircle2 size={15} />
                            <span>GUARDAR DATOS DE CARDIO</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed font-normal ${
                    isLight ? "bg-slate-50 text-slate-600 border-slate-200" : "bg-white/[0.03] text-zinc-400 border-white/[0.06]"
                }`}>
                    Has seleccionado descansar de cardio hoy. Todo el volumen metabólico y reservas de glucógeno se enfocan en la recuperación muscular y síntesis proteica de las series de fuerza.
                </div>
            )}
        </div>
    );
};
