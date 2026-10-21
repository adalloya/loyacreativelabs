// src/components/apex/SpotifyPlayerWidget.tsx
"use client";

import React from "react";
import {
    Music,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Shuffle,
    Repeat,
    Repeat1,
    Volume2,
    VolumeX,
    Speaker,
    Sliders,
    Sparkles
} from "lucide-react";
import { useApexFx } from "@/hooks/useApexFx";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { initiateSpotifyLogin } from "@/services/spotifyService";

interface SpotifyPlayerWidgetProps {
    onOpenSettings: () => void;
    restRemaining: number | null;
    onSkipRest: () => void;
}

function formatTime(ms: number): string {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const SpotifyPlayerWidget: React.FC<SpotifyPlayerWidgetProps> = ({
    onOpenSettings,
    restRemaining,
    onSkipRest
}) => {
    const {
        connected,
        track,
        isPlaying,
        bpm,
        accentRgb,
        progressMs,
        isSeeking,
        volume,
        isMuted,
        setIsSeeking,
        setProgressMs,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
    } = useSpotifyPlayback();

    const { isFxActive, visualizerMode, cycleMode } = useApexFx();

    const progressPct = track && track.durationMs > 0
        ? Math.min(100, Math.max(0, (progressMs / track.durationMs) * 100))
        : 0;

    const isLongTitle = Boolean(track && track.name.length > 20);

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setProgressMs(val);
    };

    const handleSeekCommit = async () => {
        setIsSeeking(false);
        await seekTo(progressMs);
    };

    const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        await setVolume(val);
    };

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#000000]/95 backdrop-blur-2xl border-t transition-all ${
            isFxActive
                ? "shadow-2xl"
                : "border-white/[0.12] shadow-2xl"
        } px-3 sm:px-6 pt-2 pb-[max(0.625rem,env(safe-area-inset-bottom))]`}
        style={{
            borderColor: isFxActive ? `rgba(${accentRgb}, 0.35)` : undefined,
            boxShadow: isFxActive ? `0 -10px 30px -10px rgba(${accentRgb}, 0.2)` : undefined
        }}>
            <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6 text-xs">

                {/* ZONE 1 (LEFT): Track Info & Album Art */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 max-w-[42%] sm:max-w-[28%]">
                    {!connected ? (
                        <button
                            onClick={() => initiateSpotifyLogin()}
                            className="flex items-center gap-2.5 group text-left min-w-0"
                            title="Iniciar sesión directamente con Spotify"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1DB954] flex items-center justify-center text-black shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-[#1DB954]/25">
                                <Music size={16} fill="currentColor" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-[#1DB954] transition-colors truncate block">
                                    Conectar Spotify
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono tracking-wider truncate block">
                                    Sincronizar BPM
                                </span>
                            </div>
                        </button>
                    ) : track ? (
                        <div
                            className="flex items-center gap-2 sm:gap-2.5 min-w-0 group cursor-pointer flex-1"
                            onClick={onOpenSettings}
                            title="Haz clic para ver portada grande, controles y cola de reproducción"
                        >
                            {/* Album Artwork */}
                            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0 shadow-md">
                                {track.albumArt ? (
                                    <img
                                        src={track.albumArt}
                                        alt={track.album}
                                        className={`w-full h-full object-cover transition-opacity ${isPlaying ? "opacity-100" : "opacity-80"}`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#1DB954]">
                                        <Music size={18} />
                                    </div>
                                )}
                                {isPlaying ? (
                                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#1DB954] border border-black animate-pulse" />
                                ) : track.isRecentlyPlayed ? (
                                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-amber-400 border border-black" title="En reposo" />
                                ) : null}
                            </div>

                            {/* Song Title (With Horizontal Marquee if Long) & Artist */}
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="relative overflow-hidden w-full whitespace-nowrap [mask-image:linear-gradient(to_right,black_0%,black_calc(100%-10px),transparent_100%)]">
                                    {isLongTitle ? (
                                        <div className="animate-marquee-track flex gap-8">
                                            <span className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-[#1DB954] transition-colors shrink-0">
                                                {track.name}
                                            </span>
                                            <span aria-hidden="true" className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-[#1DB954] transition-colors shrink-0">
                                                {track.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block group-hover:text-[#1DB954] transition-colors">
                                            {track.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 truncate mt-0.5">
                                    <span className="text-[11px] text-zinc-400 truncate block font-normal">
                                        {track.artist}
                                    </span>
                                    {track.deviceName && (
                                        <span className="text-[9px] font-mono text-[#10B981] hidden xs:flex items-center gap-0.5 shrink-0 bg-[#10B981]/10 px-1 rounded border border-[#10B981]/20">
                                            <Speaker size={8} />
                                            <span className="truncate max-w-[70px]">{track.deviceName}</span>
                                        </span>
                                    )}
                                    {bpm > 0 && (
                                        <span className="text-[9px] font-mono text-zinc-300 hidden sm:flex items-center gap-0.5 shrink-0 bg-white/[0.08] px-1 rounded border border-white/10" title="BPM en tiempo real">
                                            {Math.round(bpm)} BPM
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={onOpenSettings}
                            className="flex items-center gap-2 cursor-pointer text-left min-w-0"
                            title="Spotify conectado sin sesión activa. Toca para abrir"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shrink-0">
                                <Music size={16} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-white truncate block">
                                    Spotify Conectado
                                </span>
                                <span className="text-[10px] text-[#1DB954] font-mono truncate block">
                                    Tocar para reproducir
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ZONE 2 (CENTER): Controls & Scrubber */}
                <div className="flex flex-col items-center flex-1 max-w-xl px-1 sm:px-2">
                    {/* Controls Row */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Shuffle (Visible on sm screens and up to prevent squishing on iPhone) */}
                        <button
                            onClick={toggleShuffle}
                            disabled={!connected || !track}
                            className={`p-1.5 rounded-full transition-all disabled:opacity-20 hidden sm:inline-flex ${
                                track?.shuffleState
                                    ? "text-[#1DB954] hover:text-[#1ed760]"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                            title={track?.shuffleState ? "Modo aleatorio activado" : "Activar modo aleatorio"}
                        >
                            <Shuffle size={14} />
                        </button>

                        {/* Previous */}
                        <button
                            onClick={prevTrack}
                            disabled={!connected}
                            className="p-1.5 text-zinc-400 hover:text-white transition-all disabled:opacity-20 active:scale-95"
                            title="Pista Anterior"
                        >
                            <SkipBack size={17} />
                        </button>

                        {/* Play / Pause Circular Official Button */}
                        <button
                            onClick={togglePlay}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                                isPlaying
                                    ? "bg-white text-black hover:scale-105"
                                    : "bg-white text-black hover:bg-[#1DB954] hover:text-black hover:scale-105"
                            }`}
                            title={isPlaying ? "Pausar" : "Reproducir"}
                        >
                            {isPlaying ? (
                                <Pause size={17} fill="currentColor" />
                            ) : (
                                <Play size={17} fill="currentColor" className="ml-0.5" />
                            )}
                        </button>

                        {/* Next */}
                        <button
                            onClick={nextTrack}
                            disabled={!connected}
                            className="p-1.5 text-zinc-400 hover:text-white transition-all disabled:opacity-20 active:scale-95"
                            title="Siguiente Pista"
                        >
                            <SkipForward size={17} />
                        </button>

                        {/* Repeat (Visible on sm screens and up to prevent squishing on iPhone) */}
                        <button
                            onClick={toggleRepeat}
                            disabled={!connected || !track}
                            className={`p-1.5 rounded-full transition-all disabled:opacity-20 hidden sm:inline-flex ${
                                track?.repeatState && track.repeatState !== "off"
                                    ? "text-[#1DB954] hover:text-[#1ed760]"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                            title={`Repetir: ${track?.repeatState || "off"}`}
                        >
                            {track?.repeatState === "track" ? <Repeat1 size={15} /> : <Repeat size={14} />}
                        </button>
                    </div>

                    {/* Timeline & Scrubber Row */}
                    <div className="w-full flex items-center gap-2 mt-1 hidden xs:flex">
                        <span className="text-[10px] font-mono text-zinc-400 w-8 text-right shrink-0 select-none">
                            {formatTime(progressMs)}
                        </span>

                        <div className="relative flex-1 group/scrub flex items-center py-1">
                            {/* Track bar background */}
                            <div className="w-full h-1 bg-white/[0.15] rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-white group-hover/scrub:bg-[#1DB954] transition-colors rounded-full"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>

                            {/* Range input for scrubbing */}
                            <input
                                type="range"
                                min={0}
                                max={track?.durationMs || 100}
                                value={progressMs}
                                onMouseDown={() => setIsSeeking(true)}
                                onTouchStart={() => setIsSeeking(true)}
                                onChange={handleSeekChange}
                                onMouseUp={handleSeekCommit}
                                onTouchEnd={handleSeekCommit}
                                disabled={!connected || !track}
                                className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>

                        <span className="text-[10px] font-mono text-zinc-400 w-8 text-left shrink-0 select-none">
                            {formatTime(track?.durationMs || 0)}
                        </span>
                    </div>
                </div>

                {/* ZONE 3 (RIGHT): Device, Volume & Rest Telemetry */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[36%]">
                    {/* Master FX Switch (OFF, AURA, WAVE, ORB) */}
                    <button
                        type="button"
                        onClick={cycleMode}
                        className={`h-7 px-2 sm:px-2.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all border active:scale-95 shrink-0 select-none ${
                            isFxActive
                                ? "text-white shadow-sm ring-1"
                                : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/10 hover:bg-white/[0.08]"
                        }`}
                        style={{
                            backgroundColor: isFxActive ? `rgba(${accentRgb}, 0.2)` : undefined,
                            borderColor: isFxActive ? `rgba(${accentRgb}, 0.6)` : undefined,
                            boxShadow: isFxActive ? `0 0 12px rgba(${accentRgb}, 0.3)` : undefined
                        }}
                        title={
                            isFxActive
                                ? `FX: ${visualizerMode} (Clic para alternar: OFF, AURA, WAVE, ORB)`
                                : "FX: OFF (Modo silencioso: WebGL destruido al 100% con 0% CPU/GPU)"
                        }
                        aria-label="Alternar modo de efectos visuales"
                    >
                        <Sparkles
                            size={11}
                            className={isFxActive ? "animate-spin-slow" : "text-zinc-500"}
                            style={{ color: isFxActive ? `rgb(${accentRgb})` : undefined }}
                        />
                        <span className="hidden xs:inline">FX:</span>
                        <span>{visualizerMode}</span>
                    </button>

                    {/* Rest Countdown Timer OR Device / Volume */}
                    {restRemaining !== null ? (
                        <div className="flex items-center gap-2 sm:gap-3 bg-white/[0.08] border border-white/[0.15] px-2.5 sm:px-4 py-1.5 rounded-full shadow-lg animate-in fade-in">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#10B981] animate-ping shrink-0" />
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <span className="text-[9px] text-zinc-400 uppercase font-medium hidden sm:inline">
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
                        <div className="flex items-center gap-3">
                            {/* Active Device Info */}
                            {connected && track?.deviceName && (
                                <button
                                    onClick={onOpenSettings}
                                    className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 hover:text-[#1DB954] transition-colors"
                                    title={`Dispositivo activo: ${track.deviceName}`}
                                >
                                    <Speaker size={13} className="text-[#1DB954]" />
                                    <span className="truncate max-w-[110px]">{track.deviceName}</span>
                                </button>
                            )}

                            {/* Volume Slider */}
                            {connected && (
                                <div className="hidden md:flex items-center gap-1.5 group/vol">
                                    <button
                                        onClick={toggleMute}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                        title={isMuted ? "Desactivar silencio" : "Silenciar"}
                                    >
                                        {isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="w-16 h-1 bg-white/[0.15] accent-[#1DB954] rounded-full cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* Quick Playlists & Settings shortcut */}
                            <button
                                onClick={onOpenSettings}
                                className="p-2 rounded-xl text-zinc-400 hover:text-[#1DB954] hover:bg-white/[0.08] transition-all active:scale-95"
                                title="Abrir Reproductor Completo & Cola"
                            >
                                <Sliders size={15} />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
