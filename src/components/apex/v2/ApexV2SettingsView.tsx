// src/components/apex/v2/ApexV2SettingsView.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    Sliders,
    User,
    Dumbbell,
    Layers,
    FileText,
    Sparkles,
    AlertTriangle,
    RotateCcw,
    Shield,
    Trash2,
    ChevronDown,
    ChevronUp,
    Download,
    Check,
    X,
    Flame
} from "lucide-react";
import { DownloadPDFButton } from "@/components/pdf/DownloadPDFButton";

interface ApexV2SettingsViewProps {
    profile: any;
    macros: any;
    weightUnit: "lbs" | "kg";
    onWeightUnitChange: (unit: "lbs" | "kg") => void;
    trainingMethodology: "traditional" | "cycled_circuits";
    onTrainingMethodologyChange: (m: "traditional" | "cycled_circuits") => void;
    environmentMode: string;
    onEnvironmentChange: (mode: string) => void;
    onOpenRoutineImporter?: () => void;
    pdfProfile?: any;
    pdfRoutine?: any[];
    pdfWeeklyProgram?: any[];
    pdfDiet?: any;
    onResetProfile?: () => void;
    onSwitchToStable: () => void;
    onInstallPwa?: () => void;
    showInstallButton?: boolean;
}

export const ApexV2SettingsView: React.FC<ApexV2SettingsViewProps> = ({
    profile,
    macros,
    weightUnit,
    onWeightUnitChange,
    trainingMethodology,
    onTrainingMethodologyChange,
    environmentMode,
    onEnvironmentChange,
    onOpenRoutineImporter,
    pdfProfile,
    pdfRoutine,
    pdfWeeklyProgram,
    pdfDiet,
    onResetProfile,
    onSwitchToStable,
    onInstallPwa,
    showInstallButton
}) => {
    // Danger Zone Double Confirmation State
    const [dangerStep, setDangerStep] = useState<0 | 1 | 2>(0);
    const [dangerAction, setDangerAction] = useState<"history" | "profile" | null>(null);

    const handleConfirmDanger = () => {
        if (dangerAction === "profile") {
            onResetProfile?.();
        } else if (dangerAction === "history") {
            localStorage.removeItem("apex_exercise_memory");
            localStorage.removeItem("apex_completed_sets");
            localStorage.removeItem("apex_daily_nutrition_logs");
            window.location.reload();
        }
    };

    return (
        <div className="space-y-4">
            
            {/* Cabecera */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Centro de Control & Ajustes
                    </h2>
                    <p className="text-xs text-zinc-400">
                        Preferencias de biomecánica, entorno y telemetría
                    </p>
                </div>

                {/* Badge de Versión */}
                <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-mono text-[10px] font-bold">
                    V2 BETA ACTIVA
                </span>
            </div>

            {/* BLOQUE 1: Resumen Perfil Biométrico del Atleta */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-5 shadow-xl">
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/[0.06]">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                        <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white tracking-tight truncate">
                            {profile?.firstName} {profile?.lastName || ""}
                        </h3>
                        <p className="text-[11px] text-zinc-400 font-mono">
                            {profile?.age || 26} años • {profile?.weightKg || 78} kg • {profile?.heightCm || 178} cm
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[9px] text-zinc-400 font-sans block uppercase">TDEE Mantenimiento</span>
                        <span className="text-sm font-bold text-white">{macros?.tdee || 2400}</span>
                        <span className="text-[9px] text-zinc-500 block">kcal</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[9px] text-emerald-400 font-sans block uppercase">Meta Diaria</span>
                        <span className="text-sm font-bold text-white">{macros?.targetCalories || 2150}</span>
                        <span className="text-[9px] text-zinc-500 block">kcal</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[9px] text-zinc-400 font-sans block uppercase">Proteína</span>
                        <span className="text-sm font-bold text-white">{macros?.proteinG || 160}</span>
                        <span className="text-[9px] text-zinc-500 block">g / día</span>
                    </div>
                </div>
            </div>

            {/* BLOQUE 2: Sistema & Metodología */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    <Sliders className="w-4 h-4 text-white" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Sistema & Metodología
                    </h3>
                </div>

                {/* Unidad de Pesas (LBS vs KG) */}
                <div>
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                        Unidad de Carga
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-black/50 border border-white/10 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => onWeightUnitChange("lbs")}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                weightUnit === "lbs"
                                    ? "bg-white text-black shadow-md"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            LIBRAS (LBS)
                        </button>
                        <button
                            type="button"
                            onClick={() => onWeightUnitChange("kg")}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                weightUnit === "kg"
                                    ? "bg-white text-black shadow-md"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            KILOGRAMOS (KG)
                        </button>
                    </div>
                </div>

                {/* Metodología de Hipertrofia */}
                <div>
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                        Metodología de Hipertrofia
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onTrainingMethodologyChange("traditional")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                trainingMethodology === "traditional"
                                    ? "bg-white text-black border-white shadow-md font-semibold"
                                    : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                            }`}
                        >
                            <div className="text-xs font-bold">Tradicional</div>
                            <div className={`text-[10px] mt-0.5 ${trainingMethodology === "traditional" ? "text-zinc-700" : "text-zinc-500"}`}>
                                Series rectas & RIR
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => onTrainingMethodologyChange("cycled_circuits")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                trainingMethodology === "cycled_circuits"
                                    ? "bg-white text-black border-white shadow-md font-semibold"
                                    : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                            }`}
                        >
                            <div className="text-xs font-bold">Ciclado & Circuitos</div>
                            <div className={`text-[10px] mt-0.5 ${trainingMethodology === "cycled_circuits" ? "text-zinc-700" : "text-zinc-500"}`}>
                                Bloques 3x & Ciclado Carb
                            </div>
                        </button>
                    </div>
                </div>

                {/* Entorno de Entrenamiento */}
                <div>
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                        Entorno de Entrenamiento
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {[
                            { id: "full_gym", label: "Gimnasio Completo" },
                            { id: "hotel_gym", label: "Hotel (Mancuernas)" },
                            { id: "bodyweight", label: "Peso Corporal" },
                            { id: "home_gym", label: "Casa" }
                        ].map((env) => (
                            <button
                                key={env.id}
                                type="button"
                                onClick={() => onEnvironmentChange(env.id)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                    environmentMode === env.id
                                        ? "bg-white text-black border-white font-bold"
                                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
                                }`}
                            >
                                {env.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* BLOQUE 3: Inteligencia & Exportación */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Inteligencia & Exportación
                    </h3>
                </div>

                {/* Text-To-Apex */}
                {onOpenRoutineImporter && (
                    <button
                        type="button"
                        onClick={onOpenRoutineImporter}
                        className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-left transition-all cursor-pointer active:scale-98"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-[#FF2A2A]" />
                            <div>
                                <div className="text-xs font-bold text-white">Importar Rutina (Text-to-APEX)</div>
                                <div className="text-[10px] text-zinc-400">Pega texto libre para convertir a rutina estructurada</div>
                            </div>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">→</span>
                    </button>
                )}

                {/* PDF Blueprint Download */}
                <div className="w-full">
                    <DownloadPDFButton
                        profile={pdfProfile}
                        routine={pdfRoutine}
                        weeklyProgram={pdfWeeklyProgram}
                        diet={pdfDiet}
                    />
                </div>

                {/* PWA Install Button */}
                {showInstallButton && onInstallPwa && (
                    <button
                        type="button"
                        onClick={onInstallPwa}
                        className="w-full p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between text-left transition-all cursor-pointer active:scale-98"
                    >
                        <div className="flex items-center gap-3">
                            <Download className="w-4 h-4 text-zinc-300" />
                            <div>
                                <div className="text-xs font-bold text-white">Instalar Aplicación PWA</div>
                                <div className="text-[10px] text-zinc-400">Instala en la pantalla de inicio de tu iPhone / Android</div>
                            </div>
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">Instalar →</span>
                    </button>
                )}
            </div>

            {/* BLOQUE 4: Switcher de Versión (Regresar a Estable) */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-white/10 rounded-3xl p-5 shadow-xl">
                <button
                    type="button"
                    onClick={onSwitchToStable}
                    className="w-full p-3.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-white flex items-center justify-between transition-all cursor-pointer active:scale-98"
                >
                    <div className="flex items-center gap-3">
                        <RotateCcw className="w-4 h-4 text-emerald-400" />
                        <div className="text-left">
                            <div className="text-xs font-bold text-white">Regresar a Versión Estable (v1)</div>
                            <div className="text-[10px] text-emerald-200/80">Volver a la interfaz tradicional probada por usuarios</div>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                        ESTABLE
                    </span>
                </button>
            </div>

            {/* BLOQUE 5: Zona de Peligro Aislada con Doble Confirmación */}
            <div className="backdrop-blur-2xl bg-zinc-950/75 border border-red-500/20 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-[#FF2A2A]" />
                    <h3 className="text-xs font-bold text-[#FF6B6B] uppercase tracking-wider font-mono">
                        Zona de Peligro
                    </h3>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Estas acciones modifican o eliminan información almacenada en tu navegador. Cuentan con doble confirmación para prevenir borrados accidentales.
                </p>

                {/* Si no hay confirmación activa, muestra los dos botones iniciales */}
                {dangerStep === 0 && (
                    <div className="space-y-2 pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setDangerAction("history");
                                setDangerStep(1);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-[#FF6B6B] hover:text-white font-mono text-xs flex items-center justify-between transition-all cursor-pointer"
                        >
                            <span>Borrar Historial de Ejercicios Previos</span>
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setDangerAction("profile");
                                setDangerStep(1);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white font-mono text-xs flex items-center justify-between transition-all cursor-pointer"
                        >
                            <span>Reiniciar Perfil Biométrico</span>
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Paso 1 de Confirmación */}
                {dangerStep === 1 && (
                    <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span>Paso 1 de 2: ¿Estás completamente seguro?</span>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                            {dangerAction === "history"
                                ? "Se borrarán tus registros de series pasadas y logs de nutrición de este dispositivo."
                                : "Se restablecerán tus datos antropométricos y tendrás que completar el cuestionario inicial de nuevo."}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setDangerStep(0);
                                    setDangerAction(null);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white/10 text-zinc-300 text-xs font-medium cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => setDangerStep(2)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#FF2A2A] hover:bg-red-600 text-white text-xs font-bold cursor-pointer transition-colors"
                            >
                                Continuar al Paso Final →
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 2 de Confirmación Definitiva */}
                {dangerStep === 2 && (
                    <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/60 space-y-3 animate-in fade-in">
                        <div className="text-xs font-extrabold text-white uppercase tracking-wider">
                            Confirmación Final Inflexible
                        </div>
                        <p className="text-[11px] text-red-200">
                            Presiona el botón rojo para ejecutar la acción. No se puede deshacer.
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setDangerStep(0);
                                    setDangerAction(null);
                                }}
                                className="px-3 py-2 rounded-xl bg-white/10 text-zinc-300 text-xs font-medium cursor-pointer"
                            >
                                Cancelar y Proteger
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDanger}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar Definitivamente</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};
