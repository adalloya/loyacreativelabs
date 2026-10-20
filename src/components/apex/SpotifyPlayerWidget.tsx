// src/components/apex/SpotifyPlayerWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
    Disc,
    Sliders,
    Radio,
    Sparkles
} from "lucide-react";
import { useApexFx } from "@/hooks/useApexFx";
import { SpotifyThreeCanvas } from "@/components/spotify/SpotifyThreeCanvas";
import { extractAlbumAccentColor } from "@/services/spotifyTelemetry";
import {
    isSpotifyConnected,
    initiateSpotifyLogin,
    getCurrentPlayback,
    spotifyPlay,
    spotifyPause,
    spotifyNext,
    spotifyPrevious,
    spotifySeek,
    spotifySetShuffle,
    spotifySetRepeat,
    spotifySetVolume,
    SpotifyTrack,
    getTrackAudioFeatures,
    AudioFeatures
} from "@/services/spotifyService";

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
    const [connected, setConnected] = useState(false);
    const [track, setTrack] = useState<SpotifyTrack | null>(null);
    const [isOptimisticPlaying, setIsOptimisticPlaying] = useState<boolean | null>(null);
    const [isActionPending, setIsActionPending] = useState(false);
    const [localProgressMs, setLocalProgressMs] = useState(0);
    const [isSeeking, setIsSeeking] = useState(false);
    const [volume, setVolume] = useState(100);
    const [isMuted, setIsMuted] = useState(false);
    const prevVolumeRef = useRef(100);

    const { isFxActive, visualizerMode, cycleMode, toggleFx } = useApexFx();
    const [accentRgb, setAccentRgb] = useState<string>("255, 42, 42");
    const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({ tempo: 135, energy: 0.85 });

    useEffect(() => {
        if (track?.albumArt) {
            extractAlbumAccentColor(track.albumArt).then(color => {
                if (color) setAccentRgb(color);
            });
        } else {
            setAccentRgb("255, 42, 42");
        }
    }, [track?.albumArt]);

    // Consulta en tiempo real de características de audio (BPM exacto y energía)
    useEffect(() => {
        if (track?.id) {
            getTrackAudioFeatures(track.id, { name: track.name, artist: track.artist }).then(feat => {
                if (feat && feat.tempo > 0) {
                    setAudioFeatures(feat);
                }
            });
        }
    }, [track?.id]);

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch live playback state from Spotify Web API
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
            if (!isSeeking) {
                setLocalProgressMs(current.progressMs);
            }
            if (current.volumePercent !== undefined) {
                setVolume(current.volumePercent);
            }
        } else {
            setTrack(prev => (prev ? { ...prev, isPlaying: false } : null));
        }
    }, [isSeeking]);

    // Polling activo cada 2.5s según directiva de telemetría de Spotify
    useEffect(() => {
        updatePlayback();

        pollIntervalRef.current = setInterval(() => {
            updatePlayback();
        }, 2500);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [updatePlayback]);

    const isPlaying = isOptimisticPlaying !== null ? isOptimisticPlaying : (track?.isPlaying ?? false);

    // Smooth client-side ticker: updates progressMs second-by-second for real Spotify scrubber
    useEffect(() => {
        if (isPlaying && track && !isSeeking) {
            tickerIntervalRef.current = setInterval(() => {
                setLocalProgressMs(prev => {
                    if (track.durationMs && prev >= track.durationMs) return prev;
                    return prev + 1000;
                });
            }, 1000);
        } else {
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
        }

        return () => {
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
        };
    }, [isPlaying, track, isSeeking]);

    // Control Handlers
    const handleTogglePlay = async () => {
        if (!connected) {
            initiateSpotifyLogin();
            return;
        }

        setIsActionPending(true);
        const nextState = !isPlaying;
        setIsOptimisticPlaying(nextState);

        if (nextState) {
            await spotifyPlay(track?.deviceId);
        } else {
            await spotifyPause(track?.deviceId);
        }

        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 400);
    };

    const handleNext = async () => {
        if (!connected) return;
        setIsActionPending(true);
        await spotifyNext(track?.deviceId);
        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 500);
    };

    const handlePrevious = async () => {
        if (!connected) return;
        setIsActionPending(true);
        await spotifyPrevious(track?.deviceId);
        setTimeout(() => {
            updatePlayback();
            setIsActionPending(false);
        }, 500);
    };

    const handleToggleShuffle = async () => {
        if (!track) return;
        const nextShuffle = !track.shuffleState;
        setTrack({ ...track, shuffleState: nextShuffle });
        await spotifySetShuffle(nextShuffle, track?.deviceId);
    };

    const handleToggleRepeat = async () => {
        if (!track) return;
        const currentMode = track.repeatState || "off";
        const nextMode = currentMode === "off" ? "context" : currentMode === "context" ? "track" : "off";
        setTrack({ ...track, repeatState: nextMode });
        await spotifySetRepeat(nextMode, track?.deviceId);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setLocalProgressMs(val);
    };

    const handleSeekCommit = async () => {
        setIsSeeking(false);
        await spotifySeek(localProgressMs, track?.deviceId);
    };

    const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        setVolume(val);
        setIsMuted(val === 0);
        await spotifySetVolume(val, track?.deviceId);
    };

    const handleToggleMute = async () => {
        if (isMuted) {
            const restored = prevVolumeRef.current || 50;
            setVolume(restored);
            setIsMuted(false);
            await spotifySetVolume(restored, track?.deviceId);
        } else {
            prevVolumeRef.current = volume;
            setVolume(0);
            setIsMuted(true);
            await spotifySetVolume(0, track?.deviceId);
        }
    };

    const progressPct = track && track.durationMs > 0
        ? Math.min(100, Math.max(0, (localProgressMs / track.durationMs) * 100))
        : 0;

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-30 bg-[#000000]/95 backdrop-blur-2xl border-t transition-all overflow-hidden ${
            isFxActive
                ? "border-[#10B981]/30 shadow-2xl shadow-[#10B981]/15"
                : "border-white/[0.12] shadow-2xl"
        } px-3 sm:px-6 py-2.5`}>
            {/* Master FX Three.js Audio Visualizer (0% GPU/CPU when OFF, CSS when AURA) */}
            {visualizerMode !== "OFF" && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0 flex items-center justify-center">
                    <SpotifyThreeCanvas
                        mode={visualizerMode}
                        isPlaying={isPlaying}
                        trackId={track?.id}
                        bpm={audioFeatures.tempo}
                        energy={audioFeatures.energy}
                        progressMs={localProgressMs}
                        accentRgb={accentRgb}
                        restModeActive={restRemaining !== null}
                        restRemainingSeconds={restRemaining || 0}
                    />
                </div>
            )}

            <div className="relative z-10 max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6 text-xs">

                {/* ZONE 1 (LEFT): Track Info & Album Art */}
                <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[45%] sm:max-w-[28%]">
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
                                    Conectar con Spotify
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono tracking-wider truncate block">
                                    Sincronizar Ritmo // BPM
                                </span>
                            </div>
                        </button>
                    ) : track ? (
                        <div
                            className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
                            onClick={onOpenSettings}
                            title="Ver detalles de reproducción y playlists"
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
                                {isPlaying && (
                                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#1DB954] border border-black animate-pulse" />
                                )}
                            </div>

                            {/* Song Title & Artist */}
                            <div className="min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block group-hover:text-[#1DB954] transition-colors">
                                    {track.name}
                                </span>
                                <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[11px] text-zinc-400 truncate block font-normal">
                                        {track.artist}
                                    </span>
                                    {track.deviceName && (
                                        <span className="text-[9px] font-mono text-[#10B981] flex items-center gap-0.5 shrink-0 bg-[#10B981]/10 px-1 rounded border border-[#10B981]/20">
                                            <Speaker size={8} />
                                            <span className="truncate max-w-[80px]">{track.deviceName}</span>
                                        </span>
                                    )}
                                    {isPlaying && audioFeatures.tempo > 0 && (
                                        <span className="text-[9px] font-mono text-zinc-300 flex items-center gap-0.5 shrink-0 bg-white/[0.08] px-1 rounded border border-white/10" title="BPM y cadencia rítmica analizada">
                                            {Math.round(audioFeatures.tempo)} BPM
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={onOpenSettings}
                            className="flex items-center gap-2.5 cursor-pointer text-left min-w-0"
                            title="Spotify conectado sin sesión activa"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shrink-0">
                                <Music size={16} />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-white truncate block">
                                    Spotify Conectado
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono truncate block">
                                    Abre Spotify en tu dispositivo
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ZONE 2 (CENTER): Official Spotify Controls & Scrubber */}
                <div className="flex flex-col items-center flex-1 max-w-xl px-2">
                    {/* Controls Row */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Shuffle */}
                        <button
                            onClick={handleToggleShuffle}
                            disabled={!connected || !track}
                            className={`p-1.5 rounded-full transition-all disabled:opacity-20 ${
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
                            onClick={handlePrevious}
                            disabled={!connected}
                            className="p-1.5 text-zinc-400 hover:text-white transition-all disabled:opacity-20 active:scale-95"
                            title="Pista Anterior"
                        >
                            <SkipBack size={17} />
                        </button>

                        {/* Play / Pause Circular Official Button */}
                        <button
                            onClick={handleTogglePlay}
                            disabled={isActionPending}
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
                            onClick={handleNext}
                            disabled={!connected}
                            className="p-1.5 text-zinc-400 hover:text-white transition-all disabled:opacity-20 active:scale-95"
                            title="Siguiente Pista"
                        >
                            <SkipForward size={17} />
                        </button>

                        {/* Repeat */}
                        <button
                            onClick={handleToggleRepeat}
                            disabled={!connected || !track}
                            className={`p-1.5 rounded-full transition-all disabled:opacity-20 ${
                                track?.repeatState && track.repeatState !== "off"
                                    ? "text-[#1DB954] hover:text-[#1ed760]"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                            title={`Repetir: ${track?.repeatState || "off"}`}
                        >
                            {track?.repeatState === "track" ? <Repeat1 size={15} /> : <Repeat size={14} />}
                        </button>
                    </div>

                    {/* Timeline & Scrubber Row (Official Spotify Progress Bar) */}
                    <div className="w-full flex items-center gap-2 mt-1 hidden xs:flex">
                        <span className="text-[10px] font-mono text-zinc-400 w-8 text-right shrink-0 select-none">
                            {formatTime(localProgressMs)}
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
                                value={localProgressMs}
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
                    {/* Master FX Switch (WebGL Reactive Lights & Particle Wave) */}
                    <button
                        type="button"
                        onClick={cycleMode}
                        className={`h-7 px-2 sm:px-2.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all border active:scale-95 shrink-0 select-none ${
                            isFxActive
                                ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 shadow-sm shadow-[#10B981]/25 ring-1 ring-[#10B981]/30"
                                : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/10 hover:bg-white/[0.08]"
                        }`}
                        title={
                            isFxActive
                                ? `FX: ${visualizerMode} (Clic para alternar: OFF, AURA, WAVE, ORB)`
                                : "FX: OFF (Modo silencioso: WebGL destruido al 100% con 0% CPU/GPU)"
                        }
                        aria-label="Alternar modo de efectos visuales"
                    >
                        <Sparkles size={11} className={isFxActive ? "text-[#10B981] animate-spin-slow" : "text-zinc-500"} />
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
                                        onClick={handleToggleMute}
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
                                title="Playlists de Hipertrofia y Ajustes"
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
