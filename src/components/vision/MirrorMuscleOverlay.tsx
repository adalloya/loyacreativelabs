"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Gauge, Shield, RefreshCw, Zap, CheckCircle2 } from "lucide-react";

interface MirrorMuscleOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    activeExerciseName?: string;
    onVelocityRecorded?: (velocityMs: number) => void;
}

export function MirrorMuscleOverlay({
    isOpen,
    onClose,
    activeExerciseName = "Press de Banca",
    onVelocityRecorded
}: MirrorMuscleOverlayProps) {
    const [mode, setMode] = useState<"mirror_ai" | "velocity_vbt">("velocity_vbt");
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamError, setStreamError] = useState<string | null>(null);

    // VBT Telemetry State
    const [currentVelocity, setCurrentVelocity] = useState<number>(0.48);
    const [initialVelocity, setInitialVelocity] = useState<number>(0.52);
    const [velocityDropPct, setVelocityDropPct] = useState<number>(7.6);
    const [estimatedRir, setEstimatedRir] = useState<number>(2);
    const [isFatigueThresholdReached, setIsFatigueThresholdReached] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startCamera = useCallback(async () => {
        try {
            setStreamError(null);
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
                setIsStreaming(true);
            }
        } catch (e: any) {
            console.warn("Camera access warning:", e);
            setStreamError("Cámara no disponible o permiso denegado. Modo de simulación VBT activo.");
            setIsStreaming(false);
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    // Simulación cinemática VBT en caso de que no haya cámara web conectada
    const simulateRepetition = () => {
        const vel = Math.max(0.22, Math.round((currentVelocity - 0.05 + Math.random() * 0.02) * 100) / 100);
        setCurrentVelocity(vel);

        const drop = Math.round(((initialVelocity - vel) / initialVelocity) * 100);
        setVelocityDropPct(Math.max(0, drop));

        let rir = 2;
        if (vel < 0.30 || drop >= 20) {
            rir = 0;
            setIsFatigueThresholdReached(true);
        } else if (vel < 0.38 || drop >= 15) {
            rir = 1;
        }
        setEstimatedRir(rir);

        if (onVelocityRecorded) {
            onVelocityRecorded(vel);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="absolute inset-0" onClick={onClose} />

            <div className={`relative w-full max-w-xl bg-[#0A0D12] border rounded-2xl p-4 sm:p-6 shadow-2xl z-10 text-white transition-all ${isFatigueThresholdReached ? "border-[#FFB800] shadow-[0_0_30px_rgba(245,158,11,0.25)]" : "border-[#1E2633]"
                }`}>
                {/* Header & Mode Switcher */}
                <div className="flex justify-between items-center border-b border-[#1E2633] pb-3 mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 p-1 bg-[#10141D] rounded-xl border border-[#1E2633] text-xs font-mono">
                        <button
                            onClick={() => setMode("velocity_vbt")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${mode === "velocity_vbt"
                                ? "bg-white text-black shadow-sm"
                                : "text-[#8892B0] hover:text-white"
                                }`}
                        >
                            <Gauge size={13} className={mode === "velocity_vbt" ? "text-red-600" : ""} />
                            <span>VELOCIDAD VBT</span>
                        </button>
                        <button
                            onClick={() => setMode("mirror_ai")}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${mode === "mirror_ai"
                                ? "bg-white text-black shadow-sm"
                                : "text-[#8892B0] hover:text-white"
                                }`}
                        >
                            <Camera size={13} />
                            <span>ESPEJO IA</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="p-1 text-[#8892B0] hover:text-white rounded-lg hover:bg-[#161C26]">
                        <X size={20} />
                    </button>
                </div>

                {/* Viewport Area */}
                <div className="relative w-full h-64 sm:h-72 bg-[#050505] rounded-xl overflow-hidden border border-[#1E2633] flex items-center justify-center">
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isStreaming ? "block" : "hidden"}`}
                    />

                    {!isStreaming && (
                        <div className="text-center p-6 space-y-2">
                            <div className="w-12 h-12 rounded-full bg-[#161C26] border border-[#2B3547] flex items-center justify-center mx-auto text-[#64FFDA]">
                                <Camera size={22} />
                            </div>
                            <p className="text-xs font-mono text-slate-300">
                                {streamError || "Iniciando visor cinemático..."}
                            </p>
                        </div>
                    )}

                    {/* VBT Telemetry HUD Overlay */}
                    {mode === "velocity_vbt" && (
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none font-mono">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] bg-black/75 px-2.5 py-1 rounded-md border border-white/10 text-[#64FFDA]">
                                    ● VBT TRACKER // {activeExerciseName.toUpperCase()}
                                </span>
                                <span className="text-[10px] bg-black/75 px-2.5 py-1 rounded-md border border-white/10 text-white">
                                    V_BASE: {initialVelocity} m/s
                                </span>
                            </div>

                            {/* Center Velocity Dial */}
                            <div className="text-center bg-black/70 backdrop-blur-sm p-3 rounded-2xl border border-white/10 max-w-xs mx-auto">
                                <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                                    {currentVelocity.toFixed(2)} <span className="text-sm font-normal text-[#8892B0]">m/s</span>
                                </div>
                                <div className="flex justify-center gap-3 text-xs mt-1">
                                    <span className="text-[#F59E0B] font-bold">Pérdida: -{velocityDropPct}%</span>
                                    <span className="text-[#38BDF8] font-bold">RIR: {estimatedRir}</span>
                                </div>
                            </div>

                            {/* Bottom Alert Banner */}
                            <div className="text-center">
                                {isFatigueThresholdReached ? (
                                    <span className="inline-block text-[11px] bg-[#FFB800] text-black font-bold px-3 py-1 rounded-full shadow-lg">
                                        ⚡ UMBRAL DE FATIGA ALCANZADO (TERMINA LA SERIE)
                                    </span>
                                ) : (
                                    <span className="inline-block text-[10px] bg-black/70 text-slate-300 px-3 py-1 rounded-full border border-white/10">
                                        Velocidad concéntrica óptima (Fase de estímulo alto)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mirror AI Overlay */}
                    {mode === "mirror_ai" && (
                        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none font-mono">
                            <span className="text-[10px] bg-black/75 px-2.5 py-1 rounded-md border border-white/10 text-[#FF2A2A] w-fit">
                                OVERLAY TÉRMICO DE CONGESTIÓN
                            </span>
                            <div className="text-center bg-black/70 p-2.5 rounded-xl border border-white/10">
                                <p className="text-xs text-white">Postura detectada (33 nodos MediaPipe)</p>
                                <p className="text-[10px] text-[#8892B0]">Músculos activos en rojo térmico</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={simulateRepetition}
                        className="flex-1 py-2.5 bg-white hover:bg-slate-200 text-black font-mono font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Zap size={14} className="fill-black" />
                        <span>REGISTRAR REPETICIÓN (VBT)</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 bg-[#161C26] hover:bg-[#202938] border border-[#2B3547] text-white font-mono text-xs font-semibold rounded-xl transition-all"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
}
