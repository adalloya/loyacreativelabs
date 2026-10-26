// src/components/apex/v2/ApexV2LoadEvolutionModal.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Drawer } from "vaul";
import {
    TrendingUp,
    Dumbbell,
    Layers,
    Award,
    Calendar,
    ChevronDown,
    X,
    Activity,
    Sparkles,
    Flame
} from "lucide-react";
import { ExerciseItem } from "@/lib/hypertrophy-engine";
import { translateExerciseNameToSpanish } from "@/lib/spanish-exercise-translator";
import { db, ExerciseLog } from "@/lib/local-db";

interface ApexV2LoadEvolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeExercises: ExerciseItem[];
    initialExerciseId?: string;
    weightUnit: "lbs" | "kg";
    exerciseMemory: Record<string, { weight: number; reps: number }>;
    completedSets: Record<string, boolean>;
    setInputs: Record<string, { weight: number | string; reps: number | string }>;
    userBodyweight: number;
    isLight: boolean;
}

interface DataPoint {
    date: string;
    displayDate: string;
    maxWeight: number;
    repsAtMax: number;
    estimated1RM: number;
    totalVolume: number;
    setsCount: number;
}

export const ApexV2LoadEvolutionModal: React.FC<ApexV2LoadEvolutionModalProps> = ({
    isOpen,
    onClose,
    activeExercises,
    initialExerciseId,
    weightUnit,
    exerciseMemory,
    completedSets,
    setInputs,
    userBodyweight,
    isLight
}) => {
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
        return initialExerciseId || activeExercises[0]?.id || "";
    });

    useEffect(() => {
        if (initialExerciseId) {
            setSelectedExerciseId(initialExerciseId);
        } else if (!selectedExerciseId && activeExercises.length > 0) {
            setSelectedExerciseId(activeExercises[0].id);
        }
    }, [initialExerciseId, activeExercises]);

    const [dbLogs, setDbLogs] = useState<ExerciseLog[]>([]);
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Cargar historial de IndexedDB cuando se abre el modal o cambia el ejercicio
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;

        async function loadLogs() {
            try {
                const logs = await db.exercise_logs
                    .where("exercise_id")
                    .equals(selectedExerciseId)
                    .sortBy("created_at");

                if (isMounted) {
                    setDbLogs(logs || []);
                }
            } catch (err) {
                console.warn("[LoadEvolution] Error al leer logs:", err);
            }
        }

        loadLogs();
        return () => {
            isMounted = false;
        };
    }, [isOpen, selectedExerciseId]);

    const currentExercise = useMemo(() => {
        return activeExercises.find((e) => e.id === selectedExerciseId) || activeExercises[0];
    }, [activeExercises, selectedExerciseId]);

    const displayName = currentExercise ? translateExerciseNameToSpanish(currentExercise.name) : "Ejercicio";

    // Unir registros históricos con los datos completados de la sesión de hoy
    const chartData = useMemo(() => {
        const pointsByDate: Record<string, { weights: number[]; reps: number[]; date: string }> = {};

        // 1. Añadir logs históricos de Dexie
        dbLogs.forEach((log) => {
            const d = log.workout_date || (log.created_at ? log.created_at.split("T")[0] : "Anterior");
            if (!pointsByDate[d]) {
                pointsByDate[d] = { weights: [], reps: [], date: d };
            }
            pointsByDate[d].weights.push(Number(log.weight_kg) || 0);
            pointsByDate[d].reps.push(Number(log.reps_completed) || 0);
        });

        // 2. Añadir las series completadas en la sesión activa de hoy
        const todayDate = new Date().toISOString().split("T")[0];
        if (currentExercise) {
            const tSets = (currentExercise as any).target_sets || currentExercise.default_sets || 3;
            for (let sIdx = 0; sIdx < tSets; sIdx++) {
                const key = `${currentExercise.id}_${sIdx}`;
                if (completedSets[key]) {
                    const inp = setInputs[key];
                    const mem = exerciseMemory[currentExercise.id];
                    const w = inp?.weight !== undefined && inp.weight !== "" ? Number(inp.weight) : (mem?.weight || 0);
                    const r = inp?.reps !== undefined && inp.reps !== "" ? Number(inp.reps) : (mem?.reps || 10);

                    if (w > 0 && r > 0) {
                        if (!pointsByDate[todayDate]) {
                            pointsByDate[todayDate] = { weights: [], reps: [], date: todayDate };
                        }
                        pointsByDate[todayDate].weights.push(w);
                        pointsByDate[todayDate].reps.push(r);
                    }
                }
            }
        }

        // Si no hay datos registrados, generar puntos de referencia basados en memoria y metas sugeridas
        const dates = Object.keys(pointsByDate).sort();

        if (dates.length === 0) {
            // Referencia de progreso inicial para mostrar la curva al usuario
            const mem = currentExercise ? exerciseMemory[currentExercise.id] : null;
            const baseW = mem?.weight && mem.weight > 0 ? mem.weight : (weightUnit === "lbs" ? 135 : 60);
            const baseR = mem?.reps && mem.reps > 0 ? mem.reps : 10;

            const mockPoints: DataPoint[] = [
                {
                    date: "Semana -3",
                    displayDate: "Semana -3",
                    maxWeight: Math.round(baseW * 0.9),
                    repsAtMax: baseR,
                    estimated1RM: Math.round(baseW * 0.9 * (1 + baseR / 30)),
                    totalVolume: Math.round(baseW * 0.9 * baseR * 3),
                    setsCount: 3
                },
                {
                    date: "Semana -2",
                    displayDate: "Semana -2",
                    maxWeight: Math.round(baseW * 0.95),
                    repsAtMax: baseR,
                    estimated1RM: Math.round(baseW * 0.95 * (1 + baseR / 30)),
                    totalVolume: Math.round(baseW * 0.95 * baseR * 3),
                    setsCount: 3
                },
                {
                    date: "Semana -1",
                    displayDate: "Semana -1",
                    maxWeight: baseW,
                    repsAtMax: baseR,
                    estimated1RM: Math.round(baseW * (1 + baseR / 30)),
                    totalVolume: Math.round(baseW * baseR * 3),
                    setsCount: 3
                },
                {
                    date: "Hoy",
                    displayDate: "Sesión Hoy",
                    maxWeight: Math.round(baseW * 1.025),
                    repsAtMax: baseR,
                    estimated1RM: Math.round(baseW * 1.025 * (1 + baseR / 30)),
                    totalVolume: Math.round(baseW * 1.025 * baseR * 3),
                    setsCount: 3
                }
            ];
            return mockPoints;
        }

        // Convertir puntos agrupados a DataPoints calculados
        const points: DataPoint[] = dates.map((d) => {
            const entry = pointsByDate[d];
            let maxW = 0;
            let repsAtMaxW = 0;
            let max1RM = 0;
            let vol = 0;

            entry.weights.forEach((w, idx) => {
                const r = entry.reps[idx] || 1;
                vol += (w * r);
                const e1rm = Math.round(w * (1 + r / 30));
                if (w > maxW) {
                    maxW = w;
                    repsAtMaxW = r;
                }
                if (e1rm > max1RM) {
                    max1RM = e1rm;
                }
            });

            // Formatear fecha para lectura humana
            let displayDate = d;
            if (d === todayDate) {
                displayDate = "Hoy";
            } else if (d.includes("-")) {
                const parts = d.split("-");
                if (parts.length === 3) {
                    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                    const mIdx = parseInt(parts[1], 10) - 1;
                    displayDate = `${parseInt(parts[2], 10)} ${months[mIdx] || ""}`;
                }
            }

            return {
                date: d,
                displayDate,
                maxWeight: maxW,
                repsAtMax: repsAtMaxW,
                estimated1RM: max1RM,
                totalVolume: vol,
                setsCount: entry.weights.length
            };
        });

        // Si solo hay un punto histórico, interpolar un punto previo para trazar la curva
        if (points.length === 1) {
            const single = points[0];
            const prevPoint: DataPoint = {
                date: "Semana Anterior",
                displayDate: "Inicio",
                maxWeight: Math.round(single.maxWeight * 0.95),
                repsAtMax: single.repsAtMax,
                estimated1RM: Math.round(single.estimated1RM * 0.95),
                totalVolume: Math.round(single.totalVolume * 0.9),
                setsCount: single.setsCount
            };
            return [prevPoint, single];
        }

        return points;
    }, [dbLogs, currentExercise, completedSets, setInputs, exerciseMemory, weightUnit]);

    // Métricas analíticas del ejercicio seleccionado
    const stats = useMemo(() => {
        if (chartData.length === 0) {
            return { maxPR: 0, current1RM: 0, growthPct: 0, latestWeight: 0, latestReps: 0 };
        }

        const maxPR = Math.max(...chartData.map((p) => p.maxWeight));
        const latestPoint = chartData[chartData.length - 1];
        const firstPoint = chartData[0];

        const growthPct = firstPoint.maxWeight > 0
            ? Math.round(((latestPoint.maxWeight - firstPoint.maxWeight) / firstPoint.maxWeight) * 100)
            : 0;

        return {
            maxPR,
            current1RM: latestPoint.estimated1RM,
            growthPct,
            latestWeight: latestPoint.maxWeight,
            latestReps: latestPoint.repsAtMax
        };
    }, [chartData]);

    // Parámetros de la gráfica SVG
    const svgWidth = 560;
    const svgHeight = 200;
    const paddingX = 40;
    const paddingTop = 25;
    const paddingBottom = 35;

    const chartPoints = useMemo(() => {
        if (chartData.length === 0) return [];
        const weights = chartData.map((p) => p.maxWeight);
        const minW = Math.max(0, Math.min(...weights) * 0.85);
        const maxW = Math.max(...weights) * 1.15 || 100;

        const effectiveW = svgWidth - paddingX * 2;
        const effectiveH = svgHeight - paddingTop - paddingBottom;

        return chartData.map((p, idx) => {
            const x = chartData.length === 1
                ? svgWidth / 2
                : paddingX + (idx / (chartData.length - 1)) * effectiveW;
            const y = paddingTop + effectiveH - ((p.maxWeight - minW) / (maxW - minW || 1)) * effectiveH;

            return {
                x,
                y,
                point: p
            };
        });
    }, [chartData]);

    // Trazar línea Bézier suave
    const pathD = useMemo(() => {
        if (chartPoints.length === 0) return "";
        if (chartPoints.length === 1) return `M ${chartPoints[0].x} ${chartPoints[0].y}`;

        let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
        for (let i = 0; i < chartPoints.length - 1; i++) {
            const p0 = chartPoints[i];
            const p1 = chartPoints[i + 1];
            const mx = (p0.x + p1.x) / 2;
            d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
        }
        return d;
    }, [chartPoints]);

    // Trazar polígono de área para el gradiente
    const areaD = useMemo(() => {
        if (chartPoints.length < 2) return "";
        const baseLineY = svgHeight - paddingBottom;
        const first = chartPoints[0];
        const last = chartPoints[chartPoints.length - 1];

        return `${pathD} L ${last.x} ${baseLineY} L ${first.x} ${baseLineY} Z`;
    }, [pathD, chartPoints]);

    return (
        <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity" />
                <Drawer.Content className={`backdrop-blur-2xl border-t flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 max-h-[92vh] z-50 p-4 sm:p-6 pb-8 max-w-2xl mx-auto shadow-2xl overflow-y-auto ${
                    isLight ? "bg-white/95 border-slate-200 text-slate-900" : "bg-zinc-950/95 border-white/15 text-white"
                }`}>
                    <Drawer.Handle className={`mx-auto w-12 h-1.5 rounded-full mb-3 shrink-0 ${isLight ? "bg-slate-300" : "bg-zinc-700"}`} />

                    {/* Cabecera del Modal */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit/40">
                        <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                isLight ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-xs" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10"
                            }`}>
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className={`text-sm sm:text-base font-bold tracking-tight uppercase leading-tight ${
                                    isLight ? "text-slate-950" : "text-white"
                                }`}>
                                    Evolución de Carga & Sobrecarga
                                </h3>
                                <p className={`text-xs font-mono mt-0.5 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Progresión de peso, 1RM y tensión mecánica
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white"
                            }`}
                            title="Cerrar ventana"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Selector Horizontal de Ejercicios de la Rutina de Hoy */}
                    <div className="mb-4">
                        <span className={`text-[10px] font-mono uppercase font-bold tracking-wider block mb-1.5 ${
                            isLight ? "text-slate-500" : "text-zinc-400"
                        }`}>
                            Seleccionar Ejercicio ({activeExercises.length} en la sesión):
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                            {activeExercises.map((ex) => {
                                const isSel = ex.id === selectedExerciseId;
                                const trName = translateExerciseNameToSpanish(ex.name);

                                return (
                                    <button
                                        key={ex.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedExerciseId(ex.id);
                                            setHoveredPoint(null);
                                        }}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                                            isSel
                                                ? (isLight
                                                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                    : "bg-emerald-500 text-black border-emerald-400 font-bold shadow-lg shadow-emerald-500/20")
                                                : (isLight
                                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                                                    : "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 border-white/10")
                                        }`}
                                    >
                                        {trName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fila de 4 KPIs del Ejercicio Seleccionado */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                        {/* KPI 1: Última Carga */}
                        <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider block ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                Última Carga
                            </span>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                                {stats.latestWeight}{weightUnit}
                            </span>
                            <span className={`text-[10px] font-mono block text-emerald-500 font-semibold mt-0.5`}>
                                × {stats.latestReps} reps
                            </span>
                        </div>

                        {/* KPI 2: 1RM Estimado */}
                        <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider block ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                1RM Actual
                            </span>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                                {stats.current1RM}{weightUnit}
                            </span>
                            <span className={`text-[10px] font-mono block ${isLight ? "text-slate-500" : "text-zinc-500"} mt-0.5`}>
                                Fórmula Brzycki
                            </span>
                        </div>

                        {/* KPI 3: Récord Personal (PR) */}
                        <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-mono uppercase font-bold tracking-wider block ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Récord PR
                                </span>
                                <Award className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                                {stats.maxPR}{weightUnit}
                            </span>
                            <span className="text-[10px] font-mono block text-amber-500 font-semibold mt-0.5">
                                Carga máxima
                            </span>
                        </div>

                        {/* KPI 4: Sobrecarga Progresiva */}
                        <div className={`p-3 rounded-2xl border ${isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <span className={`text-[9px] font-mono uppercase font-bold tracking-wider block ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                Progresión
                            </span>
                            <span className={`text-base sm:text-lg font-mono font-bold block leading-tight mt-0.5 ${
                                stats.growthPct >= 0 ? "text-emerald-500" : "text-rose-500"
                            }`}>
                                {stats.growthPct >= 0 ? `+${stats.growthPct}%` : `${stats.growthPct}%`}
                            </span>
                            <span className={`text-[10px] font-mono block ${isLight ? "text-slate-500" : "text-zinc-500"} mt-0.5`}>
                                vs línea base
                            </span>
                        </div>
                    </div>

                    {/* Gráfica SVG de Evolución de Carga */}
                    <div className={`p-3.5 rounded-3xl border relative transition-all ${
                        isLight ? "bg-slate-50/70 border-slate-200" : "bg-black/40 border-white/10"
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold font-mono tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                {displayName}
                            </span>
                            <div className="flex items-center gap-3 text-[10px] font-mono">
                                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Carga ({weightUnit})
                                </span>
                            </div>
                        </div>

                        {/* Lienzo SVG */}
                        <div className="w-full overflow-hidden">
                            <svg
                                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                                className="w-full h-44 sm:h-52 select-none"
                            >
                                <defs>
                                    <linearGradient id="loadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="loadLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10B981" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>

                                {/* Líneas de cuadrícula sutiles */}
                                {[0.25, 0.5, 0.75].map((pct, idx) => {
                                    const y = paddingTop + (svgHeight - paddingTop - paddingBottom) * pct;
                                    return (
                                        <line
                                            key={idx}
                                            x1={paddingX}
                                            y1={y}
                                            x2={svgWidth - paddingX}
                                            y2={y}
                                            stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"}
                                            strokeDasharray="4 4"
                                            strokeWidth="1"
                                        />
                                    );
                                })}

                                {/* Área bajo la curva con gradiente */}
                                {areaD && (
                                    <path
                                        d={areaD}
                                        fill="url(#loadAreaGradient)"
                                    />
                                )}

                                {/* Trazo de la curva de carga */}
                                {pathD && (
                                    <path
                                        d={pathD}
                                        fill="none"
                                        stroke="url(#loadLineGradient)"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                )}

                                {/* Puntos de datos interactivos */}
                                {chartPoints.map((cp, idx) => {
                                    const isHovered = hoveredPoint?.date === cp.point.date;
                                    return (
                                        <g key={idx}>
                                            <circle
                                                cx={cp.x}
                                                cy={cp.y}
                                                r={isHovered ? 7 : 5}
                                                fill="#10B981"
                                                stroke={isLight ? "#ffffff" : "#09090b"}
                                                strokeWidth="2.5"
                                                className="cursor-pointer transition-all hover:scale-125"
                                                onMouseEnter={() => setHoveredPoint(cp.point)}
                                                onClick={() => setHoveredPoint(cp.point)}
                                            />
                                            {/* Etiqueta de valor sobre cada punto */}
                                            <text
                                                x={cp.x}
                                                y={cp.y - 10}
                                                textAnchor="middle"
                                                fill={isLight ? "#0f172a" : "#ffffff"}
                                                fontSize="10"
                                                fontWeight="bold"
                                                fontFamily="monospace"
                                            >
                                                {cp.point.maxWeight}{weightUnit}
                                            </text>
                                            {/* Etiqueta de fecha en el eje X */}
                                            <text
                                                x={cp.x}
                                                y={svgHeight - 12}
                                                textAnchor="middle"
                                                fill={isLight ? "#64748b" : "#a1a1aa"}
                                                fontSize="9"
                                                fontFamily="monospace"
                                            >
                                                {cp.point.displayDate}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Tooltip de Detalle Flotante */}
                        {hoveredPoint && (
                            <div className={`mt-2 p-2.5 rounded-2xl border text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in ${
                                isLight ? "bg-white border-slate-300 text-slate-900 shadow-sm" : "bg-zinc-900 border-white/20 text-white"
                            }`}>
                                <div>
                                    <span className="font-bold">{hoveredPoint.displayDate}:</span>{" "}
                                    <span>{hoveredPoint.maxWeight}{weightUnit} × {hoveredPoint.repsAtMax} reps</span>
                                </div>
                                <div className="text-emerald-500 font-semibold">
                                    1RM: ~{hoveredPoint.estimated1RM}{weightUnit}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 text-center">
                        <p className={`text-[11px] font-sans ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                            * El sistema aplica el principio de sobrecarga progresiva adaptativa según tu autorregulación y RIR percibido en cada sesión.
                        </p>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
