// src/components/nutrition/DietPreferenceModal.tsx
"use client";

import React, { useState } from "react";
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
    badgeColor: string;
    description: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
}

export const DIET_OPTIONS: DietPreferenceOption[] = [
    {
        id: "standard",
        name: "Estándar / Balanceada",
        badge: "HIPERTROFIA BASE",
        badgeColor: "text-zinc-300 bg-white/[0.08] border-white/20",
        description: "Equilibrio óptimo de carbohidratos, grasas y alta proteína (pollo, res magra, salmón, arroz, avena, huevos).",
        icon: Utensils
    },
    {
        id: "keto",
        name: "Cetogénica (Keto)",
        badge: "< 35G CARBS",
        badgeColor: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
        description: "Grasas saludables abundantes (aguacate, aceite de oliva, frutos secos), proteína moderada y carbohidratos casi nulos.",
        icon: Flame
    },
    {
        id: "low_carb",
        name: "Baja en Carbos (Low Carb)",
        badge: "CARBS MODERADOS",
        badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/30",
        description: "Carbohidratos reducidos alrededor del entrenamiento para acelerar oxidación de grasa conservando glucógeno.",
        icon: Apple
    },
    {
        id: "vegetarian",
        name: "Vegetariana",
        badge: "SIN CARNES",
        badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
        description: "Cero carnes ni aves. Incluye huevos, yogur griego, queso cottage, tofu, legumbres y proteína vegetal completa.",
        icon: Leaf
    },
    {
        id: "vegan",
        name: "Vegana (Plant-Based)",
        badge: "100% VEGETAL",
        badgeColor: "text-green-400 bg-green-400/10 border-green-400/30",
        description: "Cero productos animales. Tofu firme, tempeh, seitán, edamames, lentejas y proteína aislada de chícharo/arroz.",
        icon: Leaf
    },
    {
        id: "paleo",
        name: "Paleolítica (Paleo)",
        badge: "CERO PROCESADOS",
        badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/30",
        description: "Alimentos reales no procesados: carnes magras, pescados salvajes, huevos, tubérculos, frutas y semillas. Sin granos ni lácteos.",
        icon: ShieldCheck
    },
    {
        id: "intermittent_fasting",
        name: "Ayuno Intermitente (16/8)",
        badge: "VENTANA 8 HORAS",
        badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/30",
        description: "Ventana de alimentación de 8 horas (ej. 12:00 PM a 08:00 PM) para maximizar autofagia y sensibilidad a la insulina.",
        icon: Clock
    },
    {
        id: "custom",
        name: "Personalizada / Otra",
        badge: "A MEDIDA",
        badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/30",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans text-white">
            <div className="absolute inset-0" onClick={() => !isLoading && onClose()} />

            <div className="relative w-full max-w-2xl bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/[0.08] pb-4 mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider">
                                PROTOCOLO NUTRICIONAL // GEMINI CLINICAL AI
                            </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span>¿Sigues alguna dieta o régimen especial?</span>
                        </h2>
                        <p className="text-xs text-zinc-400 mt-1">
                            Gemini adaptará al 100% la selección de ingredientes, fuentes de proteína y distribución de macros a tu protocolo.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 text-zinc-400 hover:text-white rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all disabled:opacity-50"
                        title="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Diet Options Grid */}
                <div className="space-y-2 mb-4">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                        SELECCIONA TU RÉGIMEN ACTUAL:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {DIET_OPTIONS.map((option) => {
                            const isSelected = selectedDiet === option.id;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setSelectedDiet(option.id)}
                                    className={`text-left p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                                        isSelected
                                            ? "bg-white/[0.08] border-white text-white shadow-lg shadow-white/5 ring-1 ring-white/20"
                                            : "bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.05] hover:border-white/20"
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                                    isSelected ? "bg-white text-black" : "bg-white/[0.06] text-zinc-400"
                                                }`}>
                                                    <Icon size={14} />
                                                </div>
                                                <span className="text-xs font-bold font-mono tracking-tight text-white">
                                                    {option.name}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border uppercase shrink-0 font-medium ${option.badgeColor}`}>
                                                {option.badge}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed font-normal">
                                            {option.description}
                                        </p>
                                    </div>

                                    {isSelected && (
                                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-1 text-[10px] text-white font-mono font-medium">
                                            <Check size={12} className="text-[#10B981]" />
                                            <span>Régimen Activo Seleccionado</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Additional Allergies or Intolerances */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                            RESTRICCIONES, ALERGIAS O NOTAS CLÍNICAS (OPCIONAL):
                        </label>
                        <span className="text-[10px] text-zinc-500 font-mono">Toca para agregar rápido</span>
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
                                    className={`text-[10px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                                        active
                                            ? "bg-white text-black border-white font-bold shadow-sm"
                                            : "bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white hover:bg-white/[0.08]"
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
                        className="w-full bg-black/40 border border-white/[0.08] rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none font-mono"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() => onConfirm(selectedDiet, notes)}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2 disabled:opacity-50"
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
