// src/components/apex/SpotifyPlayerWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Music,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Disc,
    Sliders,
    Radio,
    Sparkles,
    Volume2,
    RefreshCw
} from "lucide-react";
import {
    isSpotifyConnected,
    getCurrentPlayback,
    spotifyPlay,
    spotifyPause,
    spotifyNext,
    spotifyPrevious,
    SpotifyTrack
} from "@/services/spotifyService";

interface SpotifyPlayerWidgetProps {
    onOpenSettings: () => void;
    restRemaining: number | null;
    onSkipRest: () => void;
}

export const SpotifyPlayerWidget: React.FC<SpotifyPlayerWidgetProps> = ({
    onOpenSettings,
    restRemaining,
    onSkipRest
}) => {
    const [connected, setConnected] = useState(false);
    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [isOptimisticPlaying, setIsOptimisticPlaying] = useState<boolean | null>(null);
    const [isActionPending, setIsActionPending] = useState(false);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Check connection status & update
    const updatePlayback = useCallback(async () => {
        const isConn = isSpotifyConnected();
        setConnected(isConn);
        if (!isConn) {
            setTrack(null);
            return;
        }

        const current = await getCurrentPlayback();
        if (current) {
            setTrack(current);
            setIsOptimisticPlaying(null);
        } else {
            // Nothing actively playing or paused
            setTrack(prev => (prev ? { ...prev, isPlaying: false } : null));
        }
    }, []);

    // Polling effect every 3.5 seconds
    useEffect(() => {
        updatePlayback();

        pollIntervalRef.current = setInterval(() => {
            updatePlayback();
        }, 3500);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [updatePlayback]);

    const isPlaying = isOptimisticPlaying !== null ? isOptimisticPlaying : (track?.isPlaying ?? false);

    const handleTogglePlay = async () => {
        if (!connected) {
            onOpenSettings();
            return;
        }

        setIsActionPending(true);
        const nextState = !isPlaying;
        setIsOptimisticPlaying(nextState);

        if (nextState) {
            await spotifyPlay();
        } else {
            await spotifyPause();
        }

        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 400);
    };

    const handleNext = async () => {
        if (!connected) return;
        setIsActionPending(true);
        await spotifyNext();
        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 500);
    };

    const handlePrevious = async () => {
        if (!connected) return;
        setIsActionPending(true);
        await spotifyPrevious();
        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 500);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#000000]/90 backdrop-blur-2xl border-t border-white/[0.1] px-3 sm:px-5 py-2.5 shadow-2xl transition-all">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6 text-xs">
                {/* Left Section: Track Info or Connect Prompt */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 max-w-[50%] sm:max-w-none">
                    {!connected ? (
                        <button
                            onClick={onOpenSettings}
                            className="flex items-center gap-2.5 group text-left min-w-0"
                            title="Conectar con tu cuenta de Spotify"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-[#1DB954]/10">
                                <Disc size={16} className="animate-spin-slow" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] sm:text-xs font-bold text-white tracking-tight group-hover:text-[#1DB954] transition-colors truncate">
                                        Conectar Spotify
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono tracking-wider truncate block">
                                    Sincronizar Ritmo // BPM
                                </span>
                            </div>
                        </button>
                    ) : track ? (
                        <div className="flex items-center gap-2.5 min-w-0 group cursor-pointer" onClick={onOpenSettings} title="Ajustes de Spotify y Playlists">
                            {/* Album Artwork */}
                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0 shadow-md">
                                {track.albumArt ? (
                                    <img
                                        src={track.albumArt}
                                        alt={track.album}
                                        className={`w-full h-full object-cover ${isPlaying ? "scale-100" : "opacity-80"}`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#1DB954]">
                                        <Music size={16} />
                                    </div>
                                )}
                                {isPlaying && (
                                    <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-[#1DB954] border border-black" />
                                )}
                            </div>

                            {/* Title & Artist */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] sm:text-xs font-bold text-white tracking-tight truncate block group-hover:text-[#1DB954] transition-colors">
                                        {track.name}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 truncate block font-normal">
                                    {track.artist}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={onOpenSettings}
                            className="flex items-center gap-2.5 cursor-pointer text-left min-w-0"
                            title="Spotify Conectado - Abre Spotify en tu dispositivo"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shrink-0">
                                <Music size={15} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[11px] font-semibold text-white truncate block">
                                    Spotify Conectado
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono truncate block">
                                    Pausado o sin sesión activa
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Section: Minimalist Controls (Previous, Play/Pause, Next) */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button
                        onClick={handlePrevious}
                        disabled={!connected}
                        className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        title="Pista Anterior"
                        aria-label="Pista anterior"
                    >
                        <SkipBack size={15} />
                    </button>

                    <button
                        onClick={handleTogglePlay}
                        disabled={isActionPending}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-md ${
                            isPlaying
                                ? "bg-white text-black hover:bg-zinc-200"
                                : "bg-white/[0.1] text-white hover:bg-white hover:text-black border border-white/20"
                        }`}
                        title={isPlaying ? "Pausar" : "Reproducir"}
                        aria-label={isPlaying ? "Pausar" : "Reproducir"}
                    >
                        {isPlaying ? (
                            <Pause size={14} fill="currentColor" />
                        ) : (
                            <Play size={14} fill="currentColor" className="ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!connected}
                        className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                        title="Siguiente Pista"
                        aria-label="Siguiente pista"
                    >
                        <SkipForward size={15} />
                    </button>

                    {/* Botón de Playlists & Configuración */}
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-[#1DB954] hover:bg-white/[0.08] transition-all active:scale-95 ml-0.5"
                        title="Playlists de Entrenamiento y Configuración"
                        aria-label="Playlists de entrenamiento"
                    >
                        <Sliders size={14} />
                    </button>
                </div>

                {/* Right Section: Rest Countdown Timer OR Cadence / BPM indicator */}
                <div className="flex items-center justify-end shrink-0">
                    {restRemaining !== null ? (
                        <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.08] border border-white/[0.15] px-2.5 sm:px-4 py-1.5 rounded-full shadow-lg animate-in fade-in">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <span className="text-[9px] text-zinc-400 uppercase font-medium hidden xs:inline">
                                    DESCANSO
                                </span>
                                <span className="text-xs sm:text-base font-bold font-mono text-[#10B981]">
                                    {Math.floor(restRemaining / 60)}:{(restRemaining % 60).toString().padStart(2, "0")}
                                </span>
                            </div>
                            <button
                                onClick={onSkipRest}
                                className="text-[10px] text-zinc-400 hover:text-white ml-0.5 sm:ml-1.5 underline font-medium"
                            >
                                Saltar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wide">
                                    CADENCIA
                                </span>
                                <span className="text-[11px] font-mono font-bold text-[#10B981]">
                                    140 BPM
                                </span>
                            </div>
                            <div
                                onClick={onOpenSettings}
                                className="cursor-pointer px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[10px] font-mono text-zinc-300 flex items-center gap-1.5 transition-all"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" />
                                <span className="hidden sm:inline">HIPERTROFIA</span>
                                <span>140 BPM</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
