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
    X
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
}

export const ApexV2BottomNav: React.FC<ApexV2BottomNavProps> = ({
    activeTab,
    onTabChange,
    onOpenSpotifyModal,
    isSpotifyConnected: propIsSpotifyConnected = false,
    restRemaining,
    onSkipRest
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
            <div className={`pointer-events-auto w-full relative overflow-hidden backdrop-blur-3xl rounded-full p-1.5 sm:p-2 flex items-center transition-all duration-300 ${
                isSpotifyActive ? "justify-between gap-2" : "justify-around"
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

                {/* Zona de Navegación: Iconos Grandes sin texto a lo largo de la bandeja de vidrio */}
                <div className={`flex items-center flex-1 ${
                    isSpotifyActive
                        ? "justify-around gap-1"
                        : "justify-around sm:justify-evenly w-full px-1 sm:px-3"
                }`}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                className={`relative flex items-center justify-center p-3 sm:p-3.5 rounded-full transition-all cursor-pointer group select-none active:scale-90 ${
                                    isActive
                                        ? (isLight ? "text-slate-950" : "text-white")
                                        : (isLight ? "text-slate-500 hover:text-slate-900" : "text-zinc-400 hover:text-white")
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
