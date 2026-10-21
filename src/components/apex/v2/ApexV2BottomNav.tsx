// src/components/apex/v2/ApexV2BottomNav.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Dumbbell,
    Utensils,
    Layers,
    Sliders,
    Play,
    Pause,
    Music,
    Clock,
    X,
    Mic,
    CheckCircle2,
    Loader2,
    Sparkles
} from "lucide-react";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { getInitialTheme, Theme } from "@/lib/theme";

export type ApexV2Tab = "workout" | "nutrition" | "anatomy" | "settings";

interface ApexV2BottomNavProps {
    activeTab: ApexV2Tab;
    onTabChange: (tab: ApexV2Tab) => void;
    onOpenSpotifyModal: () => void;
    isSpotifyConnected?: boolean;
    restRemaining?: number | null;
    onSkipRest?: () => void;
    // Voice Agent Props
    isVoiceListening?: boolean;
    isVoiceProcessing?: boolean;
    onVoicePointerDown?: (e: React.PointerEvent) => void;
    onVoicePointerUp?: (e: React.PointerEvent) => void;
    onVoicePointerCancel?: () => void;
    contextualTooltipText?: string;
    showPromoTooltip?: boolean;
    onDismissPromoTooltip?: () => void;
    toastMessage?: string | null;
}

export const ApexV2BottomNav: React.FC<ApexV2BottomNavProps> = ({
    activeTab,
    onTabChange,
    onOpenSpotifyModal,
    isSpotifyConnected: propIsSpotifyConnected = false,
    restRemaining,
    onSkipRest,
    isVoiceListening = false,
    isVoiceProcessing = false,
    onVoicePointerDown,
    onVoicePointerUp,
    onVoicePointerCancel,
    contextualTooltipText,
    showPromoTooltip = false,
    onDismissPromoTooltip,
    toastMessage
}) => {
    const {
        connected,
        track,
        isPlaying,
        togglePlay
    } = useSpotifyPlayback();

    const [imageError, setImageError] = useState(false);
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

    useEffect(() => {
        setImageError(false);
    }, [track?.albumArt]);

    const isLight = theme === "light";
    const isSpotifyActive = Boolean(propIsSpotifyConnected || connected);

    const navItems: { id: ApexV2Tab; label: string; icon: React.ElementType }[] = [
        { id: "workout", label: "Entrenar", icon: Dumbbell },
        { id: "nutrition", label: "Nutrición", icon: Utensils },
        { id: "anatomy", label: "Ejercicios", icon: Layers },
        { id: "settings", label: "Ajustes", icon: Sliders }
    ];

    return (
        <div className={`fixed bottom-3 sm:bottom-5 left-0 right-0 z-50 px-3 sm:px-4 mx-auto pointer-events-none transition-all duration-300 ${
            isSpotifyActive ? "max-w-lg" : "max-w-sm sm:max-w-md"
        }`}>
            {/* Anuncio Rápido de Éxito con Palomita Verde (Toast) */}
            {toastMessage && (
                <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="mb-2 pointer-events-auto mx-auto w-fit max-w-[92vw] bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/40 shadow-2xl rounded-full px-4 py-2 flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in zoom-in-95 duration-150"
                >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold truncate">{toastMessage}</span>
                </motion.div>
            )}

            {/* Rest Timer Floating Banner (Si está activo un descanso entre series) */}
            {typeof restRemaining === "number" && restRemaining > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="mb-2 pointer-events-auto mx-auto w-fit bg-zinc-950/85 backdrop-blur-xl border border-[#FF2A2A]/40 shadow-xl rounded-full px-3.5 py-1.5 flex items-center gap-2.5 text-xs text-white"
                >
                    <Clock className="w-3.5 h-3.5 text-[#FF2A2A] animate-spin" style={{ animationDuration: "3s" }} />
                    <span className="font-mono font-bold text-[#FF2A2A]">
                        DESCANSO: {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, "0")}
                    </span>
                    {onSkipRest && (
                        <button
                            type="button"
                            onClick={onSkipRest}
                            className="bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white rounded-full p-0.5 transition-colors cursor-pointer"
                            title="Saltar descanso"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </motion.div>
            )}

            {/* Bandeja de Vidrio Flotante "Liquid Glass Tray" */}
            <div className={`pointer-events-auto w-full relative overflow-visible backdrop-blur-3xl rounded-full p-1.5 sm:p-2 flex items-center transition-all duration-300 ${
                isSpotifyActive ? "justify-between gap-1.5" : "justify-around"
            } ${
                isLight
                    ? "bg-white/60 border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,0.95)] text-slate-900"
                    : "bg-zinc-950/45 border border-white/[0.18] shadow-[0_25px_50px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.25)] text-white"
            }`}>

                {/* Resplandor Especular Superior del Vidrio (Efecto Bisel Brillante) */}
                <div className={`absolute inset-x-6 top-0 h-[1.5px] pointer-events-none rounded-full ${
                    isLight
                        ? "bg-gradient-to-r from-transparent via-white/95 to-transparent"
                        : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                }`} />

                {/* Reflejo Inferior Suave */}
                <div className={`absolute inset-x-10 bottom-0 h-[1px] pointer-events-none rounded-full ${
                    isLight
                        ? "bg-gradient-to-r from-transparent via-white/50 to-transparent"
                        : "bg-gradient-to-r from-transparent via-white/15 to-transparent"
                }`} />
                
                {/* Extremo Izquierdo: Mini-Widget de Spotify (Solo se muestra si la API de Spotify está conectada) */}
                {isSpotifyActive && (
                    <div className={`flex items-center gap-2 pl-1 pr-2.5 border-r shrink-0 max-w-[125px] sm:max-w-[155px] ${
                        isLight ? "border-slate-300/80" : "border-white/15"
                    }`}>
                        <button
                            type="button"
                            onClick={onOpenSpotifyModal}
                            className={`relative w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center shrink-0 group active:scale-95 transition-transform cursor-pointer ${
                                isLight ? "bg-slate-100 border-slate-300" : "bg-zinc-900 border-white/20"
                            }`}
                            title={track ? `${track.name} - ${track.artist}` : "Abrir Spotify"}
                        >
                            {track?.albumArt && !imageError ? (
                                <img
                                    key={track.albumArt}
                                    src={track.albumArt}
                                    alt=""
                                    onError={() => setImageError(true)}
                                    className={`w-full h-full object-cover transition-opacity ${isPlaying ? "opacity-100" : "opacity-80"}`}
                                />
                            ) : (
                                <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                            )}
                            {/* Indicador de beat activo */}
                            {isPlaying && (
                                <span className="absolute inset-0 rounded-full border border-[#1DB954]/50 animate-ping" />
                            )}
                        </button>

                        <div
                            onClick={onOpenSpotifyModal}
                            className="cursor-pointer min-w-0 text-left overflow-hidden hidden xs:block sm:block"
                        >
                            <p className={`text-[11px] font-bold truncate leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                {track ? track.name : "Spotify"}
                            </p>
                            <p className={`text-[9px] truncate leading-tight font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {track ? track.artist : (connected ? "En pausa" : "Conectar")}
                            </p>
                        </div>

                        {/* Botón táctil Play/Pause */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className={`w-7 h-7 rounded-full active:scale-90 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                                isLight
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                                    : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            }`}
                            title={isPlaying ? "Pausar música" : "Reproducir música"}
                            aria-label={isPlaying ? "Pausar" : "Reproducir"}
                        >
                            {isPlaying ? (
                                <Pause className={`w-3 h-3 ${isLight ? "fill-slate-900" : "fill-white"}`} />
                            ) : (
                                <Play className={`w-3 h-3 ml-0.5 ${isLight ? "fill-slate-900" : "fill-white"}`} />
                            )}
                        </button>
                    </div>
                )}

                {/* Zona de Navegación: [ Entrenar | Nutrición ]  [ 🎙️ MIC CENTRAL ]  [ Ejercicios | Ajustes ] */}
                <div className={`flex items-center flex-1 justify-around ${
                    isSpotifyActive ? "gap-1" : "sm:justify-evenly w-full px-1"
                }`}>
                    {/* 1. Lado Izquierdo: Entrenar y Nutrición */}
                    {navItems.slice(0, 2).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-full transition-all cursor-pointer group select-none active:scale-90 ${
                                    isActive
                                        ? (isLight ? "text-slate-950" : "text-white")
                                        : (isLight ? "text-slate-500 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                                }`}
                                title={item.label}
                                aria-label={item.label}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="v2ActiveTabPill"
                                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                        className={`absolute inset-0 rounded-full ${
                                            isLight
                                                ? "bg-slate-900/10 border border-slate-900/15 shadow-sm shadow-slate-900/5 backdrop-blur-md"
                                                : "bg-white/20 border border-white/30 shadow-md shadow-white/10 backdrop-blur-md"
                                        }`}
                                    />
                                )}
                                <Icon className={`w-6 h-6 sm:w-6.5 sm:h-6.5 relative z-10 transition-transform ${
                                    isActive ? "scale-110" : "group-hover:scale-105"
                                } ${
                                    isActive
                                        ? (isLight ? "text-slate-950 stroke-[2.5]" : "text-white stroke-[2.5]")
                                        : (isLight ? "text-slate-500 stroke-[1.8]" : "text-zinc-400 stroke-[1.8]")
                                }`} />
                            </button>
                        );
                    })}

                    {/* 2. Centro Absoluto: Botón Circular Micrófono AI con Hold-to-Talk y Tooltip Dinámico */}
                    <div className="relative shrink-0 flex items-center justify-center mx-1">
                        {/* Tooltip Contextual Dinámico (Promocional o en vivo mientras escucha/procesa) */}
                        {(showPromoTooltip || isVoiceListening || isVoiceProcessing) && contextualTooltipText && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.92 }}
                                className={`absolute -top-12 sm:-top-13 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold border backdrop-blur-2xl shadow-2xl flex items-center gap-1.5 pointer-events-auto select-none ${
                                    isVoiceListening
                                        ? "bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.35)]"
                                        : isVoiceProcessing
                                        ? "bg-amber-950/95 border-amber-500/60 text-amber-200 shadow-xl"
                                        : isLight
                                        ? "bg-white/95 border-slate-300 text-slate-800 shadow-lg"
                                        : "bg-zinc-950/95 border-white/20 text-white shadow-xl"
                                }`}
                            >
                                {isVoiceProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                                ) : isVoiceListening ? (
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                ) : (
                                    <Sparkles className="w-3 h-3 text-[#FF2A2A] shrink-0" />
                                )}
                                <span className="max-w-[210px] sm:max-w-[320px] truncate">
                                    {contextualTooltipText}
                                </span>
                                {showPromoTooltip && !isVoiceListening && !isVoiceProcessing && onDismissPromoTooltip && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDismissPromoTooltip();
                                        }}
                                        className="p-0.5 hover:opacity-100 opacity-60 rounded-full cursor-pointer ml-0.5"
                                        title="Ocultar"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                                {/* Flecha del tooltip */}
                                <div className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${
                                    isVoiceListening
                                        ? "border-t-rose-950/95"
                                        : isVoiceProcessing
                                        ? "border-t-amber-950/95"
                                        : isLight
                                        ? "border-t-white/95"
                                        : "border-t-zinc-950/95"
                                }`} />
                            </motion.div>
                        )}

                        {/* Botón Circular Elevado con Pulso Líquido */}
                        <button
                            type="button"
                            onPointerDown={onVoicePointerDown}
                            onPointerUp={onVoicePointerUp}
                            onPointerCancel={onVoicePointerCancel}
                            className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full -translate-y-2 sm:-translate-y-2.5 flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 touch-none group ${
                                isVoiceListening
                                    ? "bg-gradient-to-tr from-rose-600 via-[#FF2A2A] to-rose-500 scale-110 shadow-[0_0_35px_rgba(255,42,42,0.85)] border-2 border-white ring-4 ring-rose-500/40"
                                    : isVoiceProcessing
                                    ? "bg-gradient-to-tr from-amber-600 to-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-white/60 animate-pulse"
                                    : "bg-gradient-to-tr from-[#D90429] via-[#FF2A2A] to-[#FF5C5C] hover:scale-105 border-2 border-white/40 shadow-[0_10px_25px_rgba(255,42,42,0.45),inset_0_2px_4px_rgba(255,255,255,0.4)]"
                            }`}
                            title="Mantén presionado para dictar (ejercicio, comida o búsqueda)"
                            aria-label="Dictado por voz APEX"
                        >
                            {/* Ondas expansivas radiantes cuando está escuchando */}
                            {isVoiceListening && (
                                <>
                                    <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-75 pointer-events-none" />
                                    <span className="absolute -inset-1.5 rounded-full border border-rose-400/50 animate-pulse pointer-events-none" />
                                </>
                            )}

                            {isVoiceProcessing ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                                <Mic className={`w-5 h-5 sm:w-5.5 sm:h-5.5 text-white stroke-[2.3] transition-transform ${
                                    isVoiceListening ? "scale-110" : "group-hover:scale-105"
                                }`} />
                            )}
                        </button>
                    </div>

                    {/* 3. Lado Derecho: Ejercicios (Anatomía) y Ajustes */}
                    {navItems.slice(2, 4).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                className={`relative flex items-center justify-center p-2.5 sm:p-3 rounded-full transition-all cursor-pointer group select-none active:scale-90 ${
                                    isActive
                                        ? (isLight ? "text-slate-950" : "text-white")
                                        : (isLight ? "text-slate-500 hover:text-slate-950" : "text-zinc-400 hover:text-white")
                                }`}
                                title={item.label}
                                aria-label={item.label}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="v2ActiveTabPill"
                                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                                        className={`absolute inset-0 rounded-full ${
                                            isLight
                                                ? "bg-slate-900/10 border border-slate-900/15 shadow-sm shadow-slate-900/5 backdrop-blur-md"
                                                : "bg-white/20 border border-white/30 shadow-md shadow-white/10 backdrop-blur-md"
                                        }`}
                                    />
                                )}
                                <Icon className={`w-6 h-6 sm:w-6.5 sm:h-6.5 relative z-10 transition-transform ${
                                    isActive ? "scale-110" : "group-hover:scale-105"
                                } ${
                                    isActive
                                        ? (isLight ? "text-slate-950 stroke-[2.5]" : "text-white stroke-[2.5]")
                                        : (isLight ? "text-slate-500 stroke-[1.8]" : "text-zinc-400 stroke-[1.8]")
                                }`} />
                            </button>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};
