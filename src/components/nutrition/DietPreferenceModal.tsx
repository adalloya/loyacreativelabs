// src/components/nutrition/DietPreferenceModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Sparkles, 
    Check, 
    Apple, 
    Flame, 
    Leaf, 
    Clock, 
    ShieldCheck, 
    AlertCircle,
    Utensils
} from "lucide-react";
import { getInitialTheme, Theme } from "@/lib/theme";

export type DietType = 
    | "standard"
    | "keto"
    | "low_carb"
    | "vegetarian"
    | "vegan"
    | "paleo"
    | "intermittent_fasting"
    | "custom";

export interface DietPreferenceOption {
    id: DietType;
    name: string;
    badge: string;
    darkBadgeColor: string;
    lightBadgeColor: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const DIET_OPTIONS: DietPreferenceOption[] = [
    {
        id: "standard",
        name: "Estándar / Balanceada",
        badge: "HIPERTROFIA BASE",
        darkBadgeColor: "text-zinc-300 bg-white/[0.08] border-white/20",
        lightBadgeColor: "text-slate-700 bg-slate-100 border-slate-300",
        description: "Equilibrio óptimo de carbohidratos, grasas y alta proteína (pollo, res magra, salmón, arroz, avena, huevos).",
        icon: Utensils
    },
    {
        id: "keto",
        name: "Cetogénica (Keto)",
        badge: "< 35G CARBS",
        darkBadgeColor: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
        lightBadgeColor: "text-emerald-800 bg-emerald-100/80 border-emerald-300",
        description: "Grasas saludables abundantes (aguacate, aceite de oliva, frutos secos), proteína moderada y carbohidratos casi nulos.",
        icon: Flame
    },
    {
        id: "low_carb",
        name: "Baja en Carbos (Low Carb)",
        badge: "CARBS MODERADOS",
        darkBadgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
        lightBadgeColor: "text-amber-800 bg-amber-100/80 border-amber-300",
        description: "Carbohidratos reducidos alrededor del entrenamiento para acelerar oxidación de grasa conservando glucógeno.",
        icon: Apple
    },
    {
        id: "vegetarian",
        name: "Vegetariana",
        badge: "SIN CARNES",
        darkBadgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
        lightBadgeColor: "text-emerald-800 bg-emerald-100/80 border-emerald-300",
        description: "Cero carnes ni aves. Incluye huevos, yogur griego, queso cottage, tofu, legumbres y proteína vegetal completa.",
        icon: Leaf
    },
    {
        id: "vegan",
        name: "Vegana (Plant-Based)",
        badge: "100% VEGETAL",
        darkBadgeColor: "text-green-400 bg-green-400/10 border-green-400/30",
        lightBadgeColor: "text-green-800 bg-green-100/80 border-green-300",
        description: "Cero productos animales. Tofu firme, tempeh, seitán, edamames, lentejas y proteína aislada de chícharo/arroz.",
        icon: Leaf
    },
    {
        id: "paleo",
        name: "Paleolítica (Paleo)",
        badge: "CERO PROCESADOS",
        darkBadgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/30",
        lightBadgeColor: "text-orange-800 bg-orange-100/80 border-orange-300",
        description: "Alimentos reales no procesados: carnes magras, pescados salvajes, huevos, tubérculos, frutas y semillas. Sin granos ni lácteos.",
        icon: ShieldCheck
    },
    {
        id: "intermittent_fasting",
        name: "Ayuno Intermitente (16/8)",
        badge: "VENTANA 8 HORAS",
        darkBadgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/30",
        lightBadgeColor: "text-blue-800 bg-blue-100/80 border-blue-300",
        description: "Ventana de alimentación de 8 horas (ej. 12:00 PM a 08:00 PM) para maximizar autofagia y sensibilidad a la insulina.",
        icon: Clock
    },
    {
        id: "custom",
        name: "Personalizada / Otra",
        badge: "A MEDIDA",
        darkBadgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/30",
        lightBadgeColor: "text-purple-800 bg-purple-100/80 border-purple-300",
        description: "Define tus requerimientos clínicos o preferencias específicas en el cuadro de notas a continuación.",
        icon: AlertCircle
    }
];

const COMMON_RESTRICTIONS = [
    "Sin gluten (celíaco)",
    "Sin lactosa",
    "Sin mariscos",
    "Sin cacahuates / nueces",
    "Sin cerdo",
    "Bajo en sodio",
    "Sin azúcar añadida"
];

interface DietPreferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedDiet: DietType, notes: string) => void;
    initialDiet?: DietType;
    initialNotes?: string;
    isLoading?: boolean;
}

export function DietPreferenceModal({
    isOpen,
    onClose,
    onConfirm,
    initialDiet = "standard",
    initialNotes = "",
    isLoading = false
}: DietPreferenceModalProps) {
    const [selectedDiet, setSelectedDiet] = useState<DietType>(initialDiet);
    const [notes, setNotes] = useState<string>(initialNotes);
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

    const isLight = theme === "light";

    if (!isOpen) return null;

    const handleToggleChip = (chip: string) => {
        if (notes.includes(chip)) {
            const updated = notes
                .split(",")
                .map(s => s.trim())
                .filter(s => s !== chip)
                .join(", ");
            setNotes(updated);
        } else {
            const updated = notes.trim() ? `${notes.trim()}, ${chip}` : chip;
            setNotes(updated);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 font-sans">
            {/* Backdrop Translúcido con soporte para modo claro */}
            <div
                className={`absolute inset-0 backdrop-blur-md transition-colors ${
                    isLight ? "bg-slate-900/40" : "bg-black/85"
                }`}
                onClick={() => !isLoading && onClose()}
            />

            {/* Contenedor Modal Liquid Glass */}
            <div className={`relative w-full max-w-2xl backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto border transition-all ${
                isLight
                    ? "bg-white/95 border-white/80 shadow-[0_25px_60px_rgba(15,23,42,0.2)] text-slate-900"
                    : "bg-[#121214]/95 border-white/[0.12] text-white"
            }`}>
                {/* Header */}
                <div className={`flex justify-between items-start border-b pb-4 mb-4 transition-colors ${
                    isLight ? "border-slate-200" : "border-white/[0.08]"
                }`}>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                                isLight ? "text-slate-500" : "text-zinc-400"
                            }`}>
                                PROTOCOLO NUTRICIONAL // GEMINI CLINICAL AI
                            </span>
                        </div>
                        <h2 className={`text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 ${
                            isLight ? "text-slate-950" : "text-white"
                        }`}>
                            <span>¿Sigues alguna dieta o régimen especial?</span>
                        </h2>
                        <p className={`text-xs mt-1 ${
                            isLight ? "text-slate-600" : "text-zinc-400"
                        }`}>
                            Gemini adaptará al 100% la selección de ingredientes, fuentes de proteína y distribución de macros a tu protocolo.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className={`p-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer ${
                            isLight
                                ? "text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
                                : "text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]"
                        }`}
                        title="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Diet Options Grid */}
                <div className="space-y-2 mb-4">
                    <label className={`text-[11px] font-mono uppercase tracking-wider block font-bold ${
                        isLight ? "text-slate-700" : "text-zinc-400"
                    }`}>
                        SELECCIONA TU RÉGIMEN ACTUAL:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {DIET_OPTIONS.map((option) => {
                            const isSelected = selectedDiet === option.id;
                            const Icon = option.icon;
                            const badgeColor = isLight ? option.lightBadgeColor : option.darkBadgeColor;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setSelectedDiet(option.id)}
                                    className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                                        isSelected
                                            ? (isLight
                                                ? "bg-emerald-50/90 border-emerald-500 text-slate-900 shadow-md ring-1 ring-emerald-500/30"
                                                : "bg-white/[0.08] border-white text-white shadow-lg shadow-white/5 ring-1 ring-white/20")
                                            : (isLight
                                                ? "bg-slate-50/90 hover:bg-slate-100/90 border-slate-200/90 text-slate-800 hover:border-slate-300"
                                                : "bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] hover:border-white/20")
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected
                                                        ? (isLight ? "bg-emerald-600 text-white" : "bg-white text-black")
                                                        : (isLight ? "bg-slate-200 text-slate-700" : "bg-white/[0.06] text-zinc-400")
                                                }`}>
                                                    <Icon size={14} />
                                                </div>
                                                <span className={`text-xs font-bold font-mono tracking-tight ${
                                                    isLight ? "text-slate-950" : "text-white"
                                                }`}>
                                                    {option.name}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase shrink-0 font-medium ${badgeColor}`}>
                                                {option.badge}
                                            </span>
                                        </div>
                                        <p className={`text-[11px] leading-relaxed font-normal ${
                                            isLight ? "text-slate-600" : "text-zinc-400"
                                        }`}>
                                            {option.description}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <div className={`mt-2.5 pt-2 border-t flex items-center gap-1 text-[10px] font-mono font-medium ${
                                            isLight ? "border-emerald-200/80 text-emerald-800" : "border-white/10 text-white"
                                        }`}>
                                            <Check size={12} className={isLight ? "text-emerald-600" : "text-[#10B981]"} />
                                            <span>Régimen Activo Seleccionado</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Allergies or Intolerances */}
                <div className={`rounded-2xl p-4 mb-5 space-y-3 border transition-colors ${
                    isLight ? "bg-slate-50 border-slate-200/80" : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                    <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-mono uppercase tracking-wider block font-bold ${
                            isLight ? "text-slate-700" : "text-zinc-400"
                        }`}>
                            RESTRICCIONES, ALERGIAS O NOTAS CLÍNICAS (OPCIONAL):
                        </label>
                        <span className={`text-[10px] font-mono ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                            Toca para agregar rápido
                        </span>
                    </div>

                    {/* Quick Selection Chips */}
                    <div className="flex flex-wrap gap-1.5">
                        {COMMON_RESTRICTIONS.map((chip) => {
                            const active = notes.includes(chip);
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => handleToggleChip(chip)}
                                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                                        active
                                            ? (isLight
                                                ? "bg-slate-900 text-white border-slate-900 font-bold shadow-xs"
                                                : "bg-white text-black border-white font-bold shadow-sm")
                                            : (isLight
                                                ? "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-950"
                                                : "bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]")
                                    }`}
                                >
                                    {active ? `✓ ${chip}` : `+ ${chip}`}
                                </button>
                            );
                        })}
                    </div>

                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej. Intolerante a la lactosa, sin mariscos, evitar carnes rojas por la noche, etc."
                        rows={2}
                        className={`w-full rounded-xl p-2.5 text-xs focus:outline-none resize-none font-mono border transition-colors ${
                            isLight
                                ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-800"
                                : "bg-black/40 border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-white/30"
                        }`}
                    />
                </div>

                {/* Actions */}
                <div className={`flex items-center justify-end gap-3 pt-3 border-t transition-colors ${
                    isLight ? "border-slate-200" : "border-white/[0.08]"
                }`}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer ${
                            isLight
                                ? "text-slate-600 hover:text-slate-950"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm(selectedDiet, notes)}
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-full text-xs font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-50 cursor-pointer ${
                            isLight
                                ? "bg-slate-900 hover:bg-black text-white shadow-slate-900/20"
                                : "bg-white hover:bg-zinc-200 text-black shadow-white/10"
                        }`}
                    >
                        <Sparkles size={14} className={isLoading ? "animate-spin" : ""} />
                        <span>
                            {isLoading ? "ANALIZANDO CON GEMINI AI..." : "GENERAR PLAN CON GEMINI AI →"}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
