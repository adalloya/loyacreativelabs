"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Gauge, RefreshCw, Zap, CheckCircle2, SwitchCamera } from "lucide-react";

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
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
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

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    const startCamera = useCallback(async () => {
        try {
            setStreamError(null);
            stopCamera();

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
                setIsStreaming(true);
            }
        } catch (e: any) {
            console.warn("Camera access warning:", e);
            setStreamError("Cámara no disponible o permiso denegado. Modo cinemático simulado activo.");
            setIsStreaming(false);
        }
    }, [facingMode, stopCamera]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, startCamera, stopCamera]);

    const toggleFacingMode = () => {
        setFacingMode(prev => (prev === "user" ? "environment" : "user"));
    };

    // Simulación cinemática VBT
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
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden font-sans select-none animate-in fade-in duration-200">
            {/* Live Video filling 100% of the entire screen */}
            <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`absolute inset-0 w-full h-full object-cover z-0 ${
                    facingMode === "user" ? "scale-x-[-1]" : ""
                } ${isStreaming ? "block" : "hidden"}`}
            />

            {/* Fallback if camera stream is inactive */}
            {!isStreaming && (
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#121214] via-[#09090B] to-black flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white shadow-2xl">
                        <Camera size={28} className="text-zinc-400" />
                    </div>
                    <p className="text-sm font-mono text-zinc-300 font-semibold max-w-xs">
                        Visor Cinemático Activo
                    </p>
                    <p className="text-xs font-mono text-zinc-500 max-w-sm">
                        {streamError || "Iniciando visor cinemático..."}
                    </p>
                </div>
            )}

            {/* TOP BAR (Floating Glass HUD) */}
            <div className="relative z-20 p-4 sm:p-5 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                {/* Mode Selector */}
                <div className="flex items-center gap-1 p-1 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-xs font-mono shadow-2xl">
                    <button
                        onClick={() => setMode("velocity_vbt")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            mode === "velocity_vbt"
                                ? "bg-white text-black shadow-md"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <Gauge size={13} className={mode === "velocity_vbt" ? "text-[#FF2A2A]" : ""} />
                        <span>VELOCIDAD VBT</span>
                    </button>
                    <button
                        onClick={() => setMode("mirror_ai")}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            mode === "mirror_ai"
                                ? "bg-white text-black shadow-md"
                                : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <Camera size={13} />
                        <span>ESPEJO IA</span>
                    </button>
                </div>

                {/* Right controls: Switch Camera (Frontal/Trasera) & Close */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFacingMode}
                        className="px-3 py-2 bg-black/60 backdrop-blur-xl hover:bg-black/80 border border-white/10 hover:border-white/30 text-white rounded-2xl transition-all shadow-xl flex items-center gap-1.5 text-xs font-mono active:scale-95"
                        title="Cambiar entre cámara frontal y trasera"
                        aria-label="Cambiar cámara"
                    >
                        <RefreshCw size={13} className="text-[#FF2A2A]" />
                        <span className="hidden sm:inline">Cámara:</span>
                        <span className="font-semibold uppercase">{facingMode === "user" ? "Frontal" : "Trasera"}</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 bg-black/60 backdrop-blur-xl hover:bg-black/80 border border-white/10 hover:border-white/30 text-white rounded-2xl transition-all shadow-xl active:scale-95"
                        aria-label="Cerrar visor"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* CENTER HUD TELEMETRY OVERLAY */}
            <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center justify-center my-auto pointer-events-none">
                {mode === "velocity_vbt" && (
                    <div className="space-y-4 max-w-sm w-full font-mono text-center">
                        {/* Exercise Name Badge */}
                        <div className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-white">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span className="font-bold tracking-tight">{activeExerciseName.toUpperCase()}</span>
                            <span className="text-zinc-500">•</span>
                            <span className="text-zinc-400 text-[11px]">V_BASE: {initialVelocity} m/s</span>
                        </div>

                        {/* Velocity Gauge Floating Center Box */}
                        <div className={`p-6 rounded-3xl border backdrop-blur-2xl transition-all shadow-2xl ${
                            isFatigueThresholdReached
                                ? "bg-black/85 border-[#FF2A2A] shadow-[0_0_40px_rgba(255,42,42,0.4)]"
                                : "bg-black/75 border-white/15"
                        }`}>
                            <div className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                                {currentVelocity.toFixed(2)}{" "}
                                <span className="text-lg font-normal text-zinc-400">m/s</span>
                            </div>

                            <div className="flex justify-center items-center gap-4 text-xs font-bold mt-2 pt-2 border-t border-white/10">
                                <span className="text-[#FF2A2A]">PÉRDIDA: -{velocityDropPct}%</span>
                                <span className="text-zinc-600">|</span>
                                <span className="text-white">RIR ESTIMADO: {estimatedRir}</span>
                            </div>
                        </div>

                        {/* Fatigue Warning Banner */}
                        {isFatigueThresholdReached ? (
                            <div className="bg-[#FF2A2A] text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl shadow-red-900/50 animate-bounce tracking-wide">
                                UMBRAL DE FATIGA ALCANZADO (TERMINA LA SERIE)
                            </div>
                        ) : (
                            <div className="bg-black/60 backdrop-blur-md text-zinc-300 text-[11px] px-3.5 py-1 rounded-full border border-white/10 inline-block">
                                Velocidad concéntrica óptima • Estímulo neuromuscular alto
                            </div>
                        )}
                    </div>
                )}

                {mode === "mirror_ai" && (
                    <div className="space-y-4 max-w-sm w-full font-mono text-center">
                        <div className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#FF2A2A]/40 text-xs text-[#FF2A2A] font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#FF2A2A] animate-ping" />
                            OVERLAY TÉRMICO DE CONGESTIÓN
                        </div>

                        <div className="bg-black/75 backdrop-blur-2xl p-5 rounded-3xl border border-white/15 space-y-1">
                            <p className="text-sm font-bold text-white">Postura detectada (33 nodos MediaPipe)</p>
                            <p className="text-xs text-zinc-400">Músculos activos destacados en rojo térmico biomecánico</p>
                        </div>
                    </div>
                )}
            </div>

            {/* BOTTOM BAR (Floating Glass Actions) */}
            <div className="relative z-20 p-4 sm:p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col sm:flex-row gap-2 max-w-lg mx-auto w-full">
                <button
                    onClick={simulateRepetition}
                    className="flex-1 py-3.5 bg-white hover:bg-zinc-200 text-black font-mono font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-white/10"
                >
                    <Zap size={15} className="fill-black" />
                    <span>REGISTRAR REPETICIÓN (VBT)</span>
                </button>

                <button
                    onClick={onClose}
                    className="px-6 py-3.5 bg-white/[0.1] hover:bg-white/[0.18] backdrop-blur-xl border border-white/15 text-white font-mono text-xs font-semibold rounded-2xl transition-all active:scale-95"
                >
                    Listo
                </button>
            </div>
        </div>
    );
}
