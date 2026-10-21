// src/components/apex/v2/ApexV2SettingsView.tsx
"use client";

import React, { useState, useEffect } from "react";
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
    Download,
    Check,
    X,
    Sun,
    Moon,
    Music,
    BookOpen,
    MessageSquareHeart,
    ChevronRight,
    Activity,
    Lock
} from "lucide-react";
import { DownloadPDFButton } from "@/components/pdf/DownloadPDFButton";
import { getInitialTheme, setSiteTheme, Theme } from "@/lib/theme";
import { ReadinessState } from "@/lib/hypertrophy-engine";

interface ApexV2SettingsViewProps {
    profile: any;
    macros: any;
    weightUnit: "lbs" | "kg";
    onWeightUnitChange: (unit: "lbs" | "kg") => void;
    trainingMethodology: "traditional" | "cycled_circuits";
    onTrainingMethodologyChange: (m: "traditional" | "cycled_circuits") => void;
    environmentMode: string;
    onEnvironmentChange: (mode: string) => void;
    readiness?: ReadinessState;
    onReadinessChange?: (r: ReadinessState) => void;
    onOpenRoutineImporter?: () => void;
    onOpenDietPlanModal?: () => void;
    onOpenSpotifyModal?: () => void;
    isSpotifyConnected?: boolean;
    onOpenOnboarding?: () => void;
    onOpenFeedback?: () => void;
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
    readiness = "normal",
    onReadinessChange,
    onOpenRoutineImporter,
    onOpenDietPlanModal,
    onOpenSpotifyModal,
    isSpotifyConnected = false,
    onOpenOnboarding,
    onOpenFeedback,
    pdfProfile,
    pdfRoutine,
    pdfWeeklyProgram,
    pdfDiet,
    onResetProfile,
    onSwitchToStable,
    onInstallPwa,
    showInstallButton
}) => {
    // Theme Management (Light / Dark)
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

    const handleToggleTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        setSiteTheme(newTheme);
    };

    const isLight = theme === "light";

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
        <div className="space-y-4 pb-12">
            
            {/* Cabecera Principal */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${
                        isLight ? "text-slate-950" : "text-white"
                    }`}>
                        Centro de Control & Ajustes
                    </h2>
                    <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                        Biometría, inteligencia artificial, entorno y preferencias
                    </p>
                </div>

                {/* Badge de Versión */}
                <span className="px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 font-mono text-[10px] font-bold shrink-0">
                    V2 LIQUID GLASS
                </span>
            </div>

            {/* =========================================================================
                BLOQUE 1: PERFIL BIOMÉTRICO DEL ATLETA
               ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className={`flex items-center gap-3 pb-3 mb-3 border-b ${
                    isLight ? "border-slate-200" : "border-white/[0.06]"
                }`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isLight ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    }`}>
                        <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className={`text-sm font-bold tracking-tight truncate ${
                            isLight ? "text-slate-950" : "text-white"
                        }`}>
                            {profile?.firstName} {profile?.lastName || ""}
                        </h3>
                        <p className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                            {profile?.age || 26} años • {profile?.weightKg || 78} kg • {profile?.heightCm || 178} cm
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className={`p-2.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <span className={`text-[9px] font-sans block uppercase ${isLight ? "text-slate-500 font-medium" : "text-zinc-400"}`}>
                            TDEE Mant.
                        </span>
                        <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                            {macros?.tdee || 2400}
                        </span>
                        <span className={`text-[9px] block ${isLight ? "text-slate-500" : "text-zinc-500"}`}>kcal</span>
                    </div>
                    <div className={`p-2.5 rounded-2xl border ${
                        isLight ? "bg-emerald-50/70 border-emerald-200" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <span className={`text-[9px] font-sans block uppercase font-bold text-emerald-700 dark:text-emerald-400`}>
                            Meta Diaria
                        </span>
                        <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                            {macros?.targetCalories || 2150}
                        </span>
                        <span className={`text-[9px] block ${isLight ? "text-slate-500" : "text-zinc-500"}`}>kcal</span>
                    </div>
                    <div className={`p-2.5 rounded-2xl border ${
                        isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                        <span className={`text-[9px] font-sans block uppercase ${isLight ? "text-slate-500 font-medium" : "text-zinc-400"}`}>
                            Proteína
                        </span>
                        <span className={`text-sm font-bold ${isLight ? "text-slate-950" : "text-white"}`}>
                            {macros?.proteinG || 160}
                        </span>
                        <span className={`text-[9px] block ${isLight ? "text-slate-500" : "text-zinc-500"}`}>g / día</span>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                BLOQUE 2: INTELIGENCIA ARTIFICIAL APEX & PROTOCOLOS
               ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-3 transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                    isLight ? "border-slate-200" : "border-white/[0.06]"
                }`}>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                            isLight ? "text-slate-900" : "text-white"
                        }`}>
                            Inteligencia Artificial & Protocolos
                        </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        GEMINI 2.5
                    </span>
                </div>

                {/* Generar Dieta con Gemini AI */}
                {onOpenDietPlanModal && (
                    <button
                        type="button"
                        onClick={onOpenDietPlanModal}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                            isLight
                                ? "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950 shadow-xs"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                isLight ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            }`}>
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold">Generar Dieta Personalizada (Gemini AI)</div>
                                <div className={`text-[10px] ${isLight ? "text-emerald-700" : "text-emerald-300/80"}`}>
                                    Macros, cálculo clínico, plan de 7 días y suplementación
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-emerald-500" />
                    </button>
                )}

                {/* Text-To-Apex (Importar Rutina) */}
                {onOpenRoutineImporter && (
                    <button
                        type="button"
                        onClick={onOpenRoutineImporter}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                            isLight
                                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                                isLight ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            }`}>
                                <Layers className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold">Importar Rutina (Text-to-APEX)</div>
                                <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Pega texto libre o apuntes para convertirlos a rutina estructurada
                                </div>
                            </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-zinc-500"}`} />
                    </button>
                )}

                {/* PDF Blueprint Download */}
                {pdfProfile && (
                    <div className="pt-1">
                        <DownloadPDFButton
                            profile={pdfProfile}
                            routine={pdfRoutine}
                            weeklyProgram={pdfWeeklyProgram}
                            diet={pdfDiet}
                        />
                    </div>
                )}
            </div>

            {/* =========================================================================
                BLOQUE 3: SISTEMA, METODOLOGÍA & AUTORREGULACIÓN
               ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-4 transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className={`flex items-center gap-2 pb-2 border-b ${
                    isLight ? "border-slate-200" : "border-white/[0.06]"
                }`}>
                    <Sliders className={`w-4 h-4 ${isLight ? "text-slate-800" : "text-white"}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                        isLight ? "text-slate-900" : "text-white"
                    }`}>
                        Sistema & Metodología
                    </h3>
                </div>

                {/* Unidad de Carga (LBS vs KG) */}
                <div>
                    <label className={`text-[11px] font-mono uppercase tracking-wider block mb-2 ${
                        isLight ? "text-slate-600" : "text-zinc-400"
                    }`}>
                        Unidad de Carga
                    </label>
                    <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
                        isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                    }`}>
                        <button
                            type="button"
                            onClick={() => onWeightUnitChange("lbs")}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                weightUnit === "lbs"
                                    ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                    : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                            }`}
                        >
                            LIBRAS (LBS)
                        </button>
                        <button
                            type="button"
                            onClick={() => onWeightUnitChange("kg")}
                            className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                weightUnit === "kg"
                                    ? (isLight ? "bg-white text-slate-950 shadow-sm" : "bg-white text-black shadow-md")
                                    : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                            }`}
                        >
                            KILOGRAMOS (KG)
                        </button>
                    </div>
                </div>

                {/* Metodología de Hipertrofia */}
                <div>
                    <label className={`text-[11px] font-mono uppercase tracking-wider block mb-2 ${
                        isLight ? "text-slate-600" : "text-zinc-400"
                    }`}>
                        Metodología de Hipertrofia
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onTrainingMethodologyChange("traditional")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                trainingMethodology === "traditional"
                                    ? (isLight ? "bg-white text-slate-950 border-slate-300 shadow-sm font-semibold" : "bg-white text-black border-white shadow-md font-semibold")
                                    : (isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white")
                            }`}
                        >
                            <div className="text-xs font-bold">Lineal Tradicional</div>
                            <div className={`text-[10px] mt-0.5 ${
                                trainingMethodology === "traditional" ? (isLight ? "text-slate-600" : "text-zinc-700") : (isLight ? "text-slate-500" : "text-zinc-500")
                            }`}>
                                Series rectas & RIR
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => onTrainingMethodologyChange("cycled_circuits")}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                trainingMethodology === "cycled_circuits"
                                    ? (isLight ? "bg-white text-slate-950 border-slate-300 shadow-sm font-semibold" : "bg-white text-black border-white shadow-md font-semibold")
                                    : (isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white")
                            }`}
                        >
                            <div className="text-xs font-bold">Ciclado & Circuitos</div>
                            <div className={`text-[10px] mt-0.5 ${
                                trainingMethodology === "cycled_circuits" ? (isLight ? "text-slate-600" : "text-zinc-700") : (isLight ? "text-slate-500" : "text-zinc-500")
                            }`}>
                                Bloques 3x & Ciclado Carb
                            </div>
                        </button>
                    </div>
                </div>

                {/* Disposición del Atleta Hoy (Readiness) */}
                {onReadinessChange && (
                    <div>
                        <label className={`text-[11px] font-mono uppercase tracking-wider block mb-2 flex items-center justify-between ${
                            isLight ? "text-slate-600" : "text-zinc-400"
                        }`}>
                            <span>Disposición Hoy (Readiness)</span>
                            <span className="text-rose-500 font-bold text-[9px] font-mono">AUTORREGULACIÓN</span>
                        </label>
                        <div className={`grid grid-cols-3 gap-1 p-1 rounded-2xl border ${
                            isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                        }`}>
                            {[
                                { id: "optimal", label: "Óptimo", sub: "RIR 1" },
                                { id: "normal", label: "Normal", sub: "RIR 1-2" },
                                { id: "fatigued", label: "Fatigado", sub: "-5% carga" }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onReadinessChange(item.id as ReadinessState)}
                                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                                        readiness === item.id
                                            ? (isLight ? "bg-white text-slate-950 font-bold shadow-sm" : "bg-white text-black font-semibold shadow-md")
                                            : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                                    }`}
                                >
                                    <div className="text-xs leading-none font-bold">{item.label}</div>
                                    <div className={`text-[9px] mt-0.5 ${
                                        readiness === item.id
                                            ? (isLight ? "text-slate-600" : "text-zinc-700")
                                            : (isLight ? "text-slate-400" : "text-zinc-500")
                                    }`}>
                                        {item.sub}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Entorno de Entrenamiento */}
                <div>
                    <label className={`text-[11px] font-mono uppercase tracking-wider block mb-2 ${
                        isLight ? "text-slate-600" : "text-zinc-400"
                    }`}>
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
                                        ? (isLight ? "bg-white text-slate-950 border-slate-300 font-bold shadow-xs" : "bg-white text-black border-white font-bold")
                                        : (isLight ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white")
                                }`}
                            >
                                {env.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* =========================================================================
                BLOQUE 4: MÚSICA & SPOTIFY INTEGRATION
               ========================================================================= */}
            {onOpenSpotifyModal && (
                <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-3 transition-colors ${
                    isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
                }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${
                        isLight ? "border-slate-200" : "border-white/[0.06]"
                    }`}>
                        <div className="flex items-center gap-2">
                            <Music className="w-4 h-4 text-[#1DB954]" />
                            <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                                isLight ? "text-slate-900" : "text-white"
                            }`}>
                                Música & Sonido // Spotify
                            </h3>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${
                            isSpotifyConnected ? "text-[#1DB954]" : (isLight ? "text-slate-400" : "text-zinc-500")
                        }`}>
                            {isSpotifyConnected ? "CONECTADO" : "SINCRONIZAR"}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={onOpenSpotifyModal}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                            isLight
                                ? "bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200 text-slate-900"
                                : "bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border-[#1DB954]/30 text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center shrink-0 text-[#1DB954]">
                                <Music className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold">
                                    {isSpotifyConnected ? "Control de Reproducción & Playlists" : "Conectar Cuenta de Spotify"}
                                </div>
                                <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Sincroniza tus listas y modo de entrenamiento 140 BPM
                                </div>
                            </div>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isSpotifyConnected ? "bg-[#1DB954] animate-pulse" : (isLight ? "bg-slate-300" : "bg-zinc-600")
                        }`} />
                    </button>
                </div>
            )}

            {/* =========================================================================
                BLOQUE 5: APARIENCIA & PREFERENCIAS DE LA APP
               ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-3 transition-colors ${
                isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
            }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                    isLight ? "border-slate-200" : "border-white/[0.06]"
                }`}>
                    <div className="flex items-center gap-2">
                        {theme === "light" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-violet-400" />}
                        <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                            isLight ? "text-slate-900" : "text-white"
                        }`}>
                            Apariencia & Versión UX
                        </h3>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isLight ? "bg-slate-100 border-slate-200 text-slate-700 font-bold" : "bg-white/[0.06] border-white/10 text-zinc-300 font-bold"
                    }`}>
                        {theme === "dark" ? "🌙 OSCURO" : "☀️ CLARO"}
                    </span>
                </div>

                {/* Selector Modo Oscuro vs Modo Claro */}
                <div>
                    <label className={`text-[11px] font-mono uppercase tracking-wider block mb-2 ${
                        isLight ? "text-slate-600" : "text-zinc-400"
                    }`}>
                        Tema Visual
                    </label>
                    <div className={`grid grid-cols-2 p-1 rounded-2xl border ${
                        isLight ? "bg-slate-100 border-slate-200" : "bg-black/50 border-white/10"
                    }`}>
                        <button
                            type="button"
                            onClick={() => handleToggleTheme("dark")}
                            className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                theme === "dark"
                                    ? (isLight ? "bg-white text-slate-950 font-bold shadow-sm" : "bg-white text-black font-semibold shadow-md")
                                    : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                            }`}
                        >
                            <Moon className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">Modo Oscuro</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleToggleTheme("light")}
                            className={`py-2 px-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                theme === "light"
                                    ? (isLight ? "bg-white text-slate-950 font-bold shadow-sm" : "bg-white text-black font-semibold shadow-md")
                                    : (isLight ? "text-slate-600 hover:text-slate-900" : "text-zinc-400 hover:text-white")
                            }`}
                        >
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold">Modo Claro</span>
                        </button>
                    </div>
                </div>

                {/* Botón de Instalar Aplicación PWA */}
                {showInstallButton && onInstallPwa && (
                    <button
                        type="button"
                        onClick={onInstallPwa}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                            isLight
                                ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Download className={`w-4 h-4 ${isLight ? "text-slate-600" : "text-zinc-300"}`} />
                            <div>
                                <div className="text-xs font-bold">Instalar Aplicación (PWA)</div>
                                <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Acceso directo en pantalla de inicio de iPhone / Android
                                </div>
                            </div>
                        </div>
                        <span className={`text-xs font-mono ${isLight ? "text-slate-600" : "text-zinc-400"}`}>Instalar →</span>
                    </button>
                )}

                {/* Botón Destacado: Regresar a Versión Estable (v1) */}
                <div className="pt-1">
                    <button
                        type="button"
                        onClick={onSwitchToStable}
                        className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                            isLight
                                ? "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-300 text-emerald-950 shadow-xs"
                                : "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-white"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <RotateCcw className="w-4 h-4 text-emerald-500" />
                            <div className="text-left">
                                <div className="text-xs font-bold">Regresar a Versión Estable (v1)</div>
                                <div className={`text-[10px] ${isLight ? "text-emerald-700" : "text-emerald-200/80"}`}>
                                    Volver a la interfaz tradicional probada por usuarios
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 border border-emerald-400/40 shrink-0">
                            ESTABLE
                        </span>
                    </button>
                </div>
            </div>

            {/* =========================================================================
                BLOQUE 6: AYUDA, GUÍA & FEEDBACK (MEJORA CONTINUA)
               ========================================================================= */}
            {(onOpenOnboarding || onOpenFeedback) && (
                <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-2.5 transition-colors ${
                    isLight ? "bg-white/85 border-slate-200/90 text-slate-900 shadow-slate-950/[0.04]" : "bg-zinc-950/75 border-white/10 text-white shadow-xl"
                }`}>
                    <div className={`flex items-center gap-2 pb-2 border-b ${
                        isLight ? "border-slate-200" : "border-white/[0.06]"
                    }`}>
                        <BookOpen className={`w-4 h-4 ${isLight ? "text-slate-800" : "text-white"}`} />
                        <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                            isLight ? "text-slate-900" : "text-white"
                        }`}>
                            Ayuda & Mejora Continua
                        </h3>
                    </div>

                    {/* Guía y Tutorial */}
                    {onOpenOnboarding && (
                        <button
                            type="button"
                            onClick={onOpenOnboarding}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                                isLight
                                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                    : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                                    isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.06] border-white/[0.08] text-zinc-300"
                                }`}>
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold">Guía y Tutorial para Todos</div>
                                    <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                        Paso a paso para dominar cada función de APEX
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-zinc-500"}`} />
                        </button>
                    )}

                    {/* Formulario de Feedback / Sugerencias */}
                    {onOpenFeedback && (
                        <button
                            type="button"
                            onClick={onOpenFeedback}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer active:scale-98 ${
                                isLight
                                    ? "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                                    : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                                    isLight ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-white/[0.06] border-white/[0.08] text-zinc-300"
                                }`}>
                                    <MessageSquareHeart className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold">Danos tu Opinión / Qué te Falta</div>
                                    <div className={`text-[10px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                        Buzón directo para solicitar mejoras o reportar detalles
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isLight ? "text-slate-400" : "text-zinc-500"}`} />
                        </button>
                    )}
                </div>
            )}

            {/* =========================================================================
                BLOQUE 7: ZONA DE PELIGRO AISLADA (DOBLE CAPA DE CONFIRMACIÓN)
               ========================================================================= */}
            <div className={`backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-xl border space-y-3 transition-colors ${
                isLight ? "bg-rose-50/50 border-rose-200 text-slate-900" : "bg-zinc-950/75 border-red-500/20 text-white shadow-xl"
            }`}>
                <div className={`flex items-center gap-2 pb-2 border-b ${
                    isLight ? "border-rose-200" : "border-red-500/20"
                }`}>
                    <AlertTriangle className="w-4 h-4 text-[#FF2A2A]" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-mono ${
                        isLight ? "text-rose-900" : "text-[#FF6B6B]"
                    }`}>
                        Zona de Peligro
                    </h3>
                </div>

                <p className={`text-[11px] leading-relaxed ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
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
                            className={`w-full py-2.5 px-3 rounded-xl border font-mono text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isLight
                                    ? "bg-white hover:bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
                                    : "bg-red-500/10 hover:bg-red-500/20 border-red-500/25 text-[#FF6B6B] hover:text-white"
                            }`}
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
                            className={`w-full py-2.5 px-3 rounded-xl border font-mono text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isLight
                                    ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs"
                                    : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-zinc-400 hover:text-white"
                            }`}
                        >
                            <span>Reiniciar Perfil Biométrico</span>
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Paso 1 de Confirmación */}
                {dangerStep === 1 && (
                    <div className={`p-3.5 rounded-2xl border space-y-2.5 animate-in fade-in ${
                        isLight ? "bg-rose-100/70 border-rose-300" : "bg-red-950/40 border-red-500/40"
                    }`}>
                        <div className={`flex items-center gap-2 text-xs font-bold ${
                            isLight ? "text-rose-950" : "text-red-300"
                        }`}>
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span>Paso 1 de 2: ¿Estás completamente seguro?</span>
                        </div>
                        <p className={`text-[11px] ${isLight ? "text-slate-700" : "text-zinc-300"}`}>
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
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                                    isLight ? "bg-white text-slate-700 border border-slate-300" : "bg-white/10 text-zinc-300"
                                }`}
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
                    <div className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${
                        isLight ? "bg-rose-100 border-rose-400" : "bg-red-950/60 border-red-500/60"
                    }`}>
                        <div className={`text-xs font-extrabold uppercase tracking-wider ${
                            isLight ? "text-rose-950" : "text-white"
                        }`}>
                            Confirmación Final Inflexible
                        </div>
                        <p className={`text-[11px] ${isLight ? "text-rose-900" : "text-red-200"}`}>
                            Presiona el botón rojo para ejecutar la acción. No se puede deshacer.
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setDangerStep(0);
                                    setDangerAction(null);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                                    isLight ? "bg-white text-slate-700 border border-slate-300" : "bg-white/10 text-zinc-300"
                                }`}
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

            {/* Footer Minimalista de APEX */}
            <div className="py-4 text-center">
                <p className={`text-[11px] font-mono tracking-wider ${
                    isLight ? "text-slate-500" : "text-zinc-500"
                }`}>
                    © 2026 APEX // Loya Creative Lab
                </p>
            </div>

        </div>
    );
};
