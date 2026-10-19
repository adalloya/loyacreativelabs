// src/components/nutrition/FoodCameraScannerModal.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Camera,
    X,
    RefreshCw,
    Sparkles,
    Check,
    Upload,
    SwitchCamera,
    Utensils,
    Flame,
    Zap,
    AlertCircle,
    CheckCircle2,
    PieChart,
    ChevronRight,
    Edit3
} from "lucide-react";
import { MealCategory, MEAL_CATEGORIES } from "@/lib/nutrition-tracker";

interface FoodCameraScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCategory?: MealCategory | null;
    onAddFoodItem: (category: MealCategory, item: { name: string; calories: number; proteinG?: number; carbsG?: number; fatsG?: number; portionsText?: string }) => void;
}

interface FoodDetectionResult {
    mealTitle: string;
    portionDescription: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    items: Array<{
        name: string;
        portion: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatsG: number;
    }>;
    suggestedCategory: MealCategory;
    nutritionalTip: string;
    confidencePct: number;
}

export const FoodCameraScannerModal: React.FC<FoodCameraScannerModalProps> = ({
    isOpen,
    onClose,
    initialCategory,
    onAddFoodItem
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [detectionResult, setDetectionResult] = useState<FoodDetectionResult | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Editable fields on result screen
    const [selectedCategory, setSelectedCategory] = useState<MealCategory>(initialCategory || "lunch");
    const [editedTitle, setEditedTitle] = useState("");
    const [editedCalories, setEditedCalories] = useState("");
    const [editedProtein, setEditedProtein] = useState("");
    const [editedCarbs, setEditedCarbs] = useState("");
    const [editedFats, setEditedFats] = useState("");

    // Start camera stream
    const startCamera = useCallback(async (mode: "environment" | "user") => {
        setCameraError(null);
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: mode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err: any) {
            console.warn("Camera access error:", err);
            setCameraError("No se pudo acceder a la cámara. Puedes subir una foto desde tu galería.");
        }
    }, [stream]);

    // Handle initial category changes
    useEffect(() => {
        if (initialCategory) {
            setSelectedCategory(initialCategory);
        }
    }, [initialCategory]);

    // Open/Close camera
    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera(facingMode);
        } else if (!isOpen) {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            setCapturedImage(null);
            setDetectionResult(null);
            setCameraError(null);
            setIsScanning(false);
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, capturedImage, facingMode, startCamera]);

    if (!isOpen) return null;

    // Switch between front and back camera
    const handleSwitchCamera = () => {
        const nextMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextMode);
        startCamera(nextMode);
    };

    // Send image to Argon Vision AI
    const analyzeImage = async (base64Image: string) => {
        setIsScanning(true);
        setCameraError(null);
        try {
            const res = await fetch("/api/apex/scan-food", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64Image,
                    targetCategory: selectedCategory
                })
            });

            const json = await res.json();
            if (json.success && json.data) {
                const data: FoodDetectionResult = json.data;
                setDetectionResult(data);
                setEditedTitle(data.mealTitle);
                setEditedCalories(data.calories.toString());
                setEditedProtein(data.proteinG.toString());
                setEditedCarbs((data.carbsG || 0).toString());
                setEditedFats((data.fatsG || 0).toString());
                if (data.suggestedCategory) {
                    setSelectedCategory(data.suggestedCategory);
                }
            } else {
                setCameraError(json.error || "No se pudo identificar la comida. Intenta con otra foto.");
            }
        } catch (err: any) {
            setCameraError("Error de conexión al analizar la comida. Inténtalo de nuevo.");
        } finally {
            setIsScanning(false);
        }
    };

    // Take snapshot with video stream
    const handleCaptureSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

        // Stop camera stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        setCapturedImage(dataUrl);
        analyzeImage(dataUrl);
    };

    // Upload from gallery
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            setCapturedImage(dataUrl);
            analyzeImage(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    // Reset scanner to take another photo
    const handleReset = () => {
        setCapturedImage(null);
        setDetectionResult(null);
        setCameraError(null);
        startCamera(facingMode);
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
                                Toma una foto de tu comida para calcular calorías y porciones al instante.
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

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    {/* Error Banner */}
                    {cameraError && (
                        <div className="p-3.5 bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 rounded-2xl text-xs text-[#FF2A2A] flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <span>{cameraError}</span>
                            </div>
                        </div>
                    )}

                    {/* Camera Viewfinder or Snapshot Preview */}
                    {!capturedImage ? (
                        <div className="space-y-4">
                            <div className="relative w-full aspect-[4/3] bg-black rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl flex items-center justify-center">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />

                                {/* Targeting Reticle / Scanner Overlay */}
                                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-[#10B981]/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                                    <div className="flex justify-between items-start text-[10px] font-mono text-[#10B981] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#10B981]/30 self-start">
                                        <span>ENFOCA TU PLATO O COMIDA</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
                                        <span>ARGON VISION • CALCULO VOLUMÉTRICO</span>
                                    </div>
                                </div>

                                {/* Floating Camera Toggle (Front / Back) */}
                                <button
                                    onClick={handleSwitchCamera}
                                    className="absolute top-4 right-4 p-2.5 rounded-2xl bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                                    title="Cambiar de cámara"
                                >
                                    <SwitchCamera size={18} />
                                </button>
                            </div>

                            {/* Camera Action Buttons */}
                            <div className="flex items-center justify-center gap-4 pt-1">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-sm"
                                >
                                    <Upload size={16} />
                                    <span>Subir de Galería</span>
                                </button>

                                <button
                                    onClick={handleCaptureSnapshot}
                                    className="px-7 py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-sm flex items-center gap-2.5 transition-all active:scale-95 shadow-xl shadow-[#10B981]/25"
                                >
                                    <Camera size={18} />
                                    <span>Escanear Comida</span>
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Snapshot Preview & Scanning State */}
                            <div className="relative w-full h-44 sm:h-52 bg-black rounded-2xl overflow-hidden border border-white/[0.1] shadow-inner">
                                <img
                                    src={capturedImage}
                                    alt="Foto de la comida"
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
                                        <div className="text-center">
                                            <span className="text-sm font-bold text-white block">
                                                Argon Analizando Porciones...
                                            </span>
                                            <span className="text-xs text-zinc-400 font-mono mt-0.5 block">
                                                Calculando volumen, macros y calorías
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {!isScanning && (
                                    <button
                                        onClick={handleReset}
                                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-medium border border-white/20 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                                    >
                                        <RefreshCw size={13} />
                                        <span>Tomar otra foto</span>
                                    </button>
                                )}
                            </div>

                            {/* Detection Results & Editable Confirmation */}
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
                                                {detectionResult.confidencePct}% de precisión
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={e => setEditedTitle(e.target.value)}
                                            className="w-full bg-black/40 border border-white/[0.1] focus:border-[#10B981] rounded-xl px-3 py-2 text-sm text-white font-bold outline-none transition-all"
                                            placeholder="Nombre de la comida"
                                        />
                                        <p className="text-xs text-zinc-400 font-normal">
                                            <strong className="text-zinc-300">Porción estimada: </strong>
                                            {detectionResult.portionDescription}
                                        </p>
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

                                    {/* Breakdown of detected ingredients */}
                                    {detectionResult.items && detectionResult.items.length > 0 && (
                                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-3.5 space-y-2">
                                            <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide block">
                                                DESGLOSE DE INGREDIENTES Y GRAMOS ESTIMADOS
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

                                    {/* Confirm & Save Button */}
                                    <button
                                        onClick={handleConfirmLog}
                                        className="w-full py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xl shadow-[#10B981]/20"
                                    >
                                        <CheckCircle2 size={18} />
                                        <span>Registrar en mis Alimentos ({editedCalories} kcal)</span>
                                    </button>
                                </div>
                            )}
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
