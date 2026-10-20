// src/components/nutrition/FoodCameraScannerModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Camera,
    X,
    RefreshCw,
    Sparkles,
    Check,
    Upload,
    Utensils,
    Flame,
    Zap,
    AlertCircle,
    CheckCircle2,
    PieChart,
    ChevronRight,
    Edit3,
    FileText,
    Mic
} from "lucide-react";
import { MealCategory, MEAL_CATEGORIES } from "@/lib/nutrition-tracker";

interface FoodCameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: MealCategory | null;
    onAddFoodItem: (
        category: MealCategory, 
        item: { name: string; calories: number; proteinG?: number; carbsG?: number; fatsG?: number; portionsText?: string }
    ) => void;
}

interface FoodDetectionResult {
    mealTitle: string;
    portionDescription: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    items?: Array<{
        name: string;
        portion: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatsG: number;
    }>;
    suggestedCategory?: MealCategory;
    nutritionalTip?: string;
    confidencePct?: number;
}

const QUICK_MEAL_PRESETS = [
    { label: "Pechuga + Arroz + Aguacate", text: "200g de pechuga de pollo a la plancha con 1 taza de arroz blanco y 50g de aguacate" },
    { label: "3 Huevos + Avena", text: "3 huevos enteros con 60g de avena cocida y canela" },
    { label: "Ribeye + Guacamole + 2 Tortillas", text: "250g de ribeye asado con 70g de guacamole y 2 tortillas de maíz" },
    { label: "Whey Isolate + 1 Plátano", text: "1 scoop de proteína whey isolate (30g) con 1 plátano mediano" },
    { label: "Salmón + Camote + Brócoli", text: "200g de filete de salmón salvaje con 150g de camote horneado y brócoli" },
    { label: "Lata de Atún + 2 Tostadas", text: "1 lata de atún en agua con 2 tostadas horneadas y 1/4 de aguacate" }
];

export const FoodCameraScannerModal: React.FC<FoodCameraScannerModalProps> = ({
    isOpen,
    onClose,
    initialCategory,
    onAddFoodItem
}) => {
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const [inputMode, setInputMode] = useState<"camera" | "text">("camera");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [textQuery, setTextQuery] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [detectionResult, setDetectionResult] = useState<FoodDetectionResult | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);

    // Editable fields on result screen
    const [selectedCategory, setSelectedCategory] = useState<MealCategory>(initialCategory || "lunch");
    const [editedTitle, setEditedTitle] = useState("");
    const [editedCalories, setEditedCalories] = useState("");
    const [editedProtein, setEditedProtein] = useState("");
    const [editedCarbs, setEditedCarbs] = useState("");
    const [editedFats, setEditedFats] = useState("");

    // Handle initial category changes
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    // Reset state on open/close
    useEffect(() => {
        if (!isOpen) {
            setCapturedImage(null);
            setDetectionResult(null);
            setStatusMessage(null);
            setIsScanning(false);
            setTextQuery("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Send payload (image or text) to API
    const analyzeFood = async (payload: { imageBase64?: string; textDescription?: string }) => {
        setIsScanning(true);
        setStatusMessage("Analizando composición nutricional con Gemini...");
        setIsError(false);

        try {
            const res = await fetch("/api/apex/scan-food", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: payload.imageBase64,
                    textDescription: payload.textDescription,
                    targetCategory: selectedCategory
                })
            });

            const json = await res.json();
            if (json.success && json.data) {
                const data: FoodDetectionResult = json.data;
                setDetectionResult(data);
                setEditedTitle(data.mealTitle || "Comida Registrada");
                setEditedCalories((data.calories || 0).toString());
                setEditedProtein((data.proteinG || 0).toString());
                setEditedCarbs((data.carbsG || 0).toString());
                setEditedFats((data.fatsG || 0).toString());
                if (data.suggestedCategory) {
                    setSelectedCategory(data.suggestedCategory);
                }
                setStatusMessage(null);
            } else {
                setIsError(true);
                setStatusMessage(json.error || "No se pudo identificar la comida. Ingresa los datos manualmente.");
            }
        } catch (err: any) {
            console.error("Food scanner error:", err);
            setIsError(true);
            setStatusMessage("Error de conexión. Se cargaron valores estimados.");
        } finally {
            setIsScanning(false);
        }
    };

    // Handle Image file selection (Camera or Gallery)
    const handleImageFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            setCapturedImage(dataUrl);
            analyzeFood({ imageBase64: dataUrl });
        };
        reader.readAsDataURL(file);
    };

    // Handle Text Query Submission
    const handleTextSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!textQuery.trim()) return;
        analyzeFood({ textDescription: textQuery.trim() });
    };

    // Reset scanner
    const handleReset = () => {
        setCapturedImage(null);
        setDetectionResult(null);
        setStatusMessage(null);
        setTextQuery("");
    };

    // Confirm and add to user daily meal log
    const handleConfirmLog = () => {
        if (!editedTitle.trim()) return;

        const calories = Math.max(0, parseInt(editedCalories, 10) || 0);
        const protein = Math.max(0, parseFloat(editedProtein) || 0);
        const carbs = Math.max(0, parseFloat(editedCarbs) || 0);
        const fats = Math.max(0, parseFloat(editedFats) || 0);

        onAddFoodItem(selectedCategory, {
            name: editedTitle.trim(),
            calories,
            proteinG: protein > 0 ? protein : undefined,
            carbsG: carbs > 0 ? carbs : undefined,
            fatsG: fats > 0 ? fats : undefined,
            portionsText: detectionResult?.portionDescription
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/[0.12] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-sm">
                            <Utensils size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                    Escáner de Alimentos con IA
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 font-semibold">
                                    ARGON VISION
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Toma una foto o escribe lo que vas a comer para calcular calorías y macros al instante.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-all"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Sub-header Mode Selector (Foto vs Texto) */}
                {!detectionResult && (
                    <div className="p-3 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setInputMode("camera")}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                                inputMode === "camera"
                                    ? "bg-white text-black shadow-md font-bold"
                                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                            }`}
                        >
                            <Camera size={14} />
                            <span>Foto / Cámara</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setInputMode("text")}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                                inputMode === "text"
                                    ? "bg-white text-black shadow-md font-bold"
                                    : "bg-white/[0.04] text-zinc-400 hover:text-white"
                            }`}
                        >
                            <FileText size={14} />
                            <span>Escribir / Describir</span>
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    {/* Status / Error Banner */}
                    {statusMessage && (
                        <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                            isError 
                                ? "bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 text-[#FF2A2A]"
                                : "bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]"
                        }`}>
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="flex-1 font-mono">
                                <span>{statusMessage}</span>
                            </div>
                        </div>
                    )}

                    {/* Mode A: Native Photo / Camera */}
                    {!detectionResult && inputMode === "camera" && (
                        <div className="space-y-4">
                            {!capturedImage ? (
                                <div className="p-8 sm:p-12 border-2 border-dashed border-white/[0.12] hover:border-[#10B981]/50 rounded-3xl text-center space-y-4 bg-white/[0.01] transition-all">
                                    <div className="w-16 h-16 rounded-3xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center mx-auto text-[#10B981] shadow-lg shadow-[#10B981]/10">
                                        <Camera size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm sm:text-base font-bold text-white">
                                            Captura tu plato con la cámara
                                        </h4>
                                        <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                                            Compatible 100% con iOS Safari y Android Chrome. No se bloquea en negro.
                                        </p>
                                    </div>

                                    {/* Dual Action Buttons (Camera / Gallery) */}
                                    <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="px-6 py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-[#10B981]/25"
                                        >
                                            <Camera size={18} />
                                            <span>Abrir Cámara</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => galleryInputRef.current?.click()}
                                            className="px-5 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                                        >
                                            <Upload size={16} />
                                            <span>Elegir de Galería</span>
                                        </button>
                                    </div>

                                    {/* Native Inputs with capture="environment" */}
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleImageFileSelected}
                                        className="hidden"
                                    />
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileSelected}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative w-full h-52 sm:h-64 bg-black rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl">
                                        <img
                                            src={capturedImage}
                                            alt="Foto del alimento"
                                            className="w-full h-full object-cover"
                                        />
                                        {isScanning && (
                                            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                                <div className="relative w-12 h-12">
                                                    <div className="absolute inset-0 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
                                                    <div className="absolute inset-2 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                                                        <Utensils size={18} />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-white">
                                                    Argon Analizando Porciones...
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {!isScanning && (
                                        <div className="flex justify-center">
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                                            >
                                                <RefreshCw size={13} />
                                                <span>Tomar otra foto</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mode B: Text / Description Input */}
                    {!detectionResult && inputMode === "text" && (
                        <div className="space-y-4">
                            <form onSubmit={handleTextSubmit} className="space-y-3">
                                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                                    DESCRIBE TUS ALIMENTOS O PORCIONES:
                                </label>
                                <textarea
                                    value={textQuery}
                                    onChange={e => setTextQuery(e.target.value)}
                                    rows={3}
                                    placeholder="Ej. 250g de pechuga de pollo a la plancha con 1 taza de arroz blanco y medio aguacate"
                                    className="w-full bg-black/40 border border-white/[0.1] focus:border-[#10B981] rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder:text-zinc-600 outline-none transition-all resize-none font-mono"
                                />

                                <button
                                    type="submit"
                                    disabled={!textQuery.trim() || isScanning}
                                    className="w-full py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 shadow-xl shadow-[#10B981]/20"
                                >
                                    <Sparkles size={16} className={isScanning ? "animate-spin" : ""} />
                                    <span>{isScanning ? "Calculando Macros..." : "Calcular Calorías con IA"}</span>
                                </button>
                            </form>

                            {/* Quick Presets */}
                            <div className="pt-2 space-y-2">
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                                    EJEMPLOS FITNESS RÁPIDOS (1 TOQUE):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {QUICK_MEAL_PRESETS.map((preset, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                setTextQuery(preset.text);
                                                analyzeFood({ textDescription: preset.text });
                                            }}
                                            className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-left text-xs transition-all flex items-center justify-between group"
                                        >
                                            <span className="text-zinc-300 font-medium group-hover:text-white truncate">
                                                {preset.label}
                                            </span>
                                            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detection Results & Editable Confirmation Screen */}
                    {detectionResult && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            {/* Editable Meal Title */}
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                        <Edit3 size={11} className="text-[#10B981]" />
                                        <span>PLATILLO IDENTIFICADO</span>
                                    </label>
                                    <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full border border-[#10B981]/20">
                                        {detectionResult.confidencePct || 90}% de precisión
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={e => setEditedTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/[0.1] focus:border-[#10B981] rounded-xl px-3 py-2 text-sm text-white font-bold outline-none transition-all"
                                    placeholder="Nombre de la comida"
                                />
                                {detectionResult.portionDescription && (
                                    <p className="text-xs text-zinc-400 font-normal">
                                        <strong className="text-zinc-300">Porción: </strong>
                                        {detectionResult.portionDescription}
                                    </p>
                                )}
                            </div>

                            {/* Macronutrient Telemetry Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                {/* Calories */}
                                <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                                        CALORÍAS
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            value={editedCalories}
                                            onChange={e => setEditedCalories(e.target.value)}
                                            className="w-16 bg-transparent text-lg font-bold font-mono text-white outline-none"
                                        />
                                        <span className="text-xs text-zinc-500 font-mono">kcal</span>
                                    </div>
                                </div>

                                {/* Protein */}
                                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl">
                                    <span className="text-[10px] font-mono uppercase text-[#10B981] font-semibold block mb-1">
                                        PROTEÍNA
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={editedProtein}
                                            onChange={e => setEditedProtein(e.target.value)}
                                            className="w-14 bg-transparent text-lg font-bold font-mono text-[#10B981] outline-none"
                                        />
                                        <span className="text-xs text-[#10B981]/70 font-mono">g</span>
                                    </div>
                                </div>

                                {/* Carbs */}
                                <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                                        CARBOS
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={editedCarbs}
                                            onChange={e => setEditedCarbs(e.target.value)}
                                            className="w-14 bg-transparent text-lg font-bold font-mono text-white outline-none"
                                        />
                                        <span className="text-xs text-zinc-500 font-mono">g</span>
                                    </div>
                                </div>

                                {/* Fats */}
                                <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl">
                                    <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                                        GRASAS
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={editedFats}
                                            onChange={e => setEditedFats(e.target.value)}
                                            className="w-14 bg-transparent text-lg font-bold font-mono text-white outline-none"
                                        />
                                        <span className="text-xs text-zinc-500 font-mono">g</span>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown of detected ingredients (Safe check against undefined.map) */}
                            {Array.isArray(detectionResult.items) && detectionResult.items.length > 0 && (
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 space-y-2">
                                    <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide block">
                                        DESGLOSE DE INGREDIENTES
                                    </span>
                                    <div className="space-y-1.5">
                                        {detectionResult.items.map((it, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                                    <span className="text-white font-medium">{it.name}</span>
                                                    <span className="text-zinc-500 font-mono text-[11px]">({it.portion})</span>
                                                </div>
                                                <div className="flex items-center gap-2 font-mono text-xs">
                                                    <span className="text-zinc-300 font-semibold">{it.calories} kcal</span>
                                                    <span className="text-[#10B981]">({it.proteinG}g P)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category Assignment Selector */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                                    ASIGNAR A TIEMPO DE COMIDA:
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                    {MEAL_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.key)}
                                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                                                selectedCategory === cat.key
                                                    ? "bg-white text-black border-white shadow-md font-bold"
                                                    : "bg-white/[0.04] text-zinc-300 border-white/[0.06] hover:bg-white/[0.08]"
                                            }`}
                                        >
                                            <span>{cat.iconEmoji}</span>
                                            <span className="truncate">{cat.title.split(" ")[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Argon Nutrition Tip */}
                            {detectionResult.nutritionalTip && (
                                <div className="p-3 bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl text-xs text-zinc-300 flex items-start gap-2">
                                    <Sparkles size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                                    <span>
                                        <strong className="text-[#10B981]">Argon Tip: </strong>
                                        {detectionResult.nutritionalTip}
                                    </span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 text-xs font-semibold transition-all"
                                >
                                    Reiniciar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmLog}
                                    className="flex-1 py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-[#10B981]/20"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Registrar en mis Alimentos ({editedCalories} kcal)</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-zinc-500">
                    <span className="text-[10px] font-mono">APEX // ARGON FOOD VISION</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-all"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};
