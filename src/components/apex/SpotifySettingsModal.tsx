// src/components/apex/SpotifySettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Music,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Shuffle,
    Repeat,
    Repeat1,
    Check,
    LogOut,
    Sparkles,
    Disc,
    Radio,
    Speaker,
    ExternalLink,
    Smartphone,
    Laptop,
    Tv,
    RefreshCw,
    AlertCircle,
    ListMusic,
    Clock
} from "lucide-react";
import {
    initiateSpotifyLogin,
    disconnectSpotify,
    CURATED_WORKOUT_PLAYLISTS,
    WorkoutPlaylist,
    spotifyPlayPlaylist,
    spotifyGetDevices,
    spotifyTransferPlayback,
    openSpotifyDeepLink,
    isIOSDevice,
    SpotifyDevice
} from "@/services/spotifyService";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";

interface SpotifySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: () => void;
}

function formatTime(ms: number): string {
    if (!ms || isNaN(ms)) return "0:00";
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getDeviceIcon(type: string) {
    const t = (type || "").toLowerCase();
    if (t.includes("smartphone") || t.includes("phone")) return Smartphone;
    if (t.includes("computer") || t.includes("laptop")) return Laptop;
    if (t.includes("tv")) return Tv;
    return Speaker;
}

export const SpotifySettingsModal: React.FC<SpotifySettingsModalProps> = ({
    isOpen,
    onClose,
    onStatusChange
}) => {
    const {
        connected,
        track,
        isPlaying,
        bpm,
        energy,
        accentRgb,
        progressMs,
        queue,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        playQueueItem,
        toggleShuffle,
        toggleRepeat,
        loadQueue,
        refreshPlayback
    } = useSpotifyPlayback();

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
    const [customUri, setCustomUri] = useState("");
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
    const [fallbackPlaylist, setFallbackPlaylist] = useState<WorkoutPlaylist | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    const loadDevices = async () => {
        setIsRefreshingDevices(true);
        try {
            const devs = await spotifyGetDevices();
            setDevices(devs);
            const active = devs.find(d => d.is_active);
            if (active) {
                setSelectedDeviceId(active.id);
            } else if (devs.length > 0 && !selectedDeviceId) {
                setSelectedDeviceId(devs[0].id);
            }
        } finally {
            setIsRefreshingDevices(false);
        }
    };

    const handleDetectMusic = async () => {
        setIsDetecting(true);
        setErrorMsg(null);
        setSuccessMsg(null);
        try {
            await loadDevices();
            await refreshPlayback();
            await loadQueue();
            setSuccessMsg("¡Sincronización completada! Si la música está sonando en tu Spotify, los controles y el visualizador responderán.");
        } catch {
            setErrorMsg("No se pudo detectar reproducción activa. Asegúrate de tener música sonando en tu app de Spotify.");
        } finally {
            setTimeout(() => setIsDetecting(false), 500);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setErrorMsg(null);
            setSuccessMsg(null);
            setIsConnecting(false);
            setFallbackPlaylist(null);

            if (connected) {
                loadDevices();
                loadQueue();
                refreshPlayback();
            }
        }
    }, [isOpen, connected, loadQueue, refreshPlayback]);

    if (!isOpen) return null;

    const handleConnect = async () => {
        setErrorMsg(null);
        try {
            setIsConnecting(true);
            await initiateSpotifyLogin();
        } catch (err: any) {
            setErrorMsg(err.message || "Error al iniciar conexión con Spotify.");
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnectSpotify();
        setDevices([]);
        if (onStatusChange) onStatusChange();
    };

    const handleTransferDevice = async (deviceId: string) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setSelectedDeviceId(deviceId);
        const ok = await spotifyTransferPlayback(deviceId, true);
        if (ok) {
            setSuccessMsg("Reproducción transferida con éxito.");
            setTimeout(() => {
                loadDevices();
                refreshPlayback();
            }, 800);
        } else {
            setErrorMsg("Asegúrate de que Spotify esté abierto en ese dispositivo.");
        }
    };

    const handlePlayPlaylist = async (playlist: WorkoutPlaylist) => {
        setPlayingPlaylistId(playlist.id);
        setErrorMsg(null);
        setSuccessMsg(null);
        setFallbackPlaylist(null);

        const result = await spotifyPlayPlaylist(playlist.spotifyUri, selectedDeviceId || undefined);
        if (result.success) {
            setSuccessMsg(`¡Reproduciendo "${playlist.name}" en ${result.deviceName || "tu dispositivo"}!`);
            setTimeout(() => {
                loadDevices();
                loadQueue();
                refreshPlayback();
            }, 1000);
        } else {
            setFallbackPlaylist(playlist);
            setErrorMsg(result.error || "No se detectó ningún dispositivo activo de Spotify.");
        }
        setTimeout(() => setPlayingPlaylistId(null), 1200);
    };

    const handlePlayCustom = async () => {
        if (!customUri.trim()) return;
        let formatted = customUri.trim();
        const result = await spotifyPlayPlaylist(formatted, selectedDeviceId || undefined);
        if (result.success) {
            setSuccessMsg("¡Iniciando reproducción de playlist personalizada!");
            setCustomUri("");
            setTimeout(() => {
                loadDevices();
                loadQueue();
                refreshPlayback();
            }, 1000);
        } else {
            setErrorMsg(result.error || "Asegúrate de tener Spotify abierto.");
        }
    };

    const progressPct = track && track.durationMs > 0
        ? Math.min(100, Math.max(0, (progressMs / track.durationMs) * 100))
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/[0.12] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-sm">
                            <Music size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                                    Spotify for APEX
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30 font-semibold">
                                    OFFICIAL
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Controla tu música e hipertrofia directamente desde tus entrenamientos.
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

                {/* Body (Scrollable) */}
                <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
                    {/* Error / Fallback Banner */}
                    {errorMsg && (
                        <div className="p-4 bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 rounded-2xl space-y-2 animate-in fade-in">
                            <div className="flex items-start gap-2.5 text-xs text-[#FF2A2A]">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{errorMsg}</p>
                                    <p className="text-[11px] text-zinc-400 mt-1">
                                        Si Spotify está en segundo plano o suspendido, ábrelo para despertar el reproductor.
                                    </p>
                                </div>
                            </div>
                            {fallbackPlaylist && (
                                <div className="pt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openSpotifyDeepLink(fallbackPlaylist.spotifyUri, fallbackPlaylist.webUrl)}
                                        className="px-4 py-2 bg-[#1DB954] text-black font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Abrir en la App de Spotify</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            loadDevices();
                                            refreshPlayback();
                                        }}
                                        className="px-3 py-2 bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs font-mono rounded-xl border border-white/10"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success Banner */}
                    {successMsg && (
                        <div className="p-3.5 bg-[#10B981]/15 border border-[#10B981]/30 rounded-2xl text-xs text-[#10B981] font-semibold flex items-center gap-2 animate-in fade-in">
                            <Check size={16} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Login / Status Card */}
                    {!connected ? (
                        <div className="bg-gradient-to-br from-[#1DB954]/10 via-black/40 to-transparent border border-[#1DB954]/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
                            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#1DB954] flex items-center justify-center text-black shadow-lg shadow-[#1DB954]/25">
                                <Disc size={28} className="animate-spin-slow" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white tracking-tight">
                                    Sincroniza tus Sesiones con Spotify
                                </h4>
                                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                    Conéctate con tu cuenta para ver la carátula en grande, controlar la reproducción y sincronizar visualizadores 3D en tiempo real.
                                </p>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full py-3.5 px-6 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl shadow-[#1DB954]/30 hover:shadow-[#1DB954]/40"
                            >
                                <Music size={18} fill="currentColor" />
                                <span>{isConnecting ? "Conectando con Spotify..." : "Conectar con Spotify"}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* REPRODUCTOR EXPANDIDO CON PORTADA GRANDE */}
                            {/* REPRODUCTOR EXPANDIDO CON PORTADA GRANDE */}
                            {track ? (
                                <div className="relative bg-gradient-to-b from-white/[0.06] to-black/60 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden">
                                    {/* Ambient Glow matching album art */}
                                    <div
                                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
                                        style={{ backgroundColor: `rgb(${accentRgb})` }}
                                    />

                                    {/* Gran Carátula del Álbum */}
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl mb-4 group">
                                            {track.albumArt ? (
                                                <img
                                                    src={track.albumArt}
                                                    alt={track.album}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#1DB954]">
                                                    <Music size={48} />
                                                </div>
                                            )}
                                            {isPlaying ? (
                                                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-mono text-[#10B981] flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                                                    <span>LIVE</span>
                                                </div>
                                            ) : track.isRecentlyPlayed ? (
                                                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/30 text-[9px] font-mono text-amber-400 flex items-center gap-1">
                                                    <span>REPOSO</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Song Title & Artist */}
                                        <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight line-clamp-1 max-w-full">
                                            {track.name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-0.5 line-clamp-1">
                                            {track.artist}
                                        </p>

                                        {/* Badges de Telemetría (BPM y Dispositivo) */}
                                        <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                                            {bpm > 0 && (
                                                <span className="text-[10px] font-mono font-bold text-[#10B981] bg-[#10B981]/15 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                                                    ⚡️ {Math.round(bpm)} BPM
                                                </span>
                                            )}
                                            {track.deviceName ? (
                                                <span className="text-[10px] font-mono text-zinc-300 bg-white/[0.08] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                                                    <Speaker size={10} className="text-[#1DB954]" />
                                                    <span className="truncate max-w-[120px]">{track.deviceName}</span>
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                                    Esperando Audio en Dispositivo
                                                </span>
                                            )}
                                            {track.isRecentlyPlayed && (
                                                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/10">
                                                    Última Pista
                                                </span>
                                            )}
                                        </div>

                                        {/* Botón de Sincronizar / Despertar en la App para iPhone / Dispositivos en reposo */}
                                        {!isPlaying && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleDetectMusic}
                                                    disabled={isDetecting}
                                                    className="px-3.5 py-1.5 bg-white/[0.1] hover:bg-white/[0.18] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-white/20 active:scale-95 transition-all"
                                                >
                                                    <RefreshCw size={12} className={isDetecting ? "animate-spin" : ""} />
                                                    <span>{isDetecting ? "Detectando..." : "Detectar Música"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openSpotifyDeepLink(track.uri || "spotify:")}
                                                    className="px-3.5 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                                                >
                                                    <Play size={12} fill="currentColor" />
                                                    <span>Abrir en Spotify</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Scrubber Progress Bar */}
                                        <div className="w-full mt-4 space-y-1">
                                            <div className="relative w-full flex items-center group py-1">
                                                <div className="w-full h-1.5 bg-white/[0.15] rounded-full overflow-hidden relative">
                                                    <div
                                                        className="h-full bg-white group-hover:bg-[#1DB954] transition-colors rounded-full"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={track.durationMs || 100}
                                                    value={progressMs}
                                                    onChange={(e) => seekTo(parseInt(e.target.value, 10))}
                                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                                <span>{formatTime(progressMs)}</span>
                                                <span>{formatTime(track.durationMs)}</span>
                                            </div>
                                        </div>

                                        {/* Controles de Reproducción Expandidos */}
                                        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3">
                                            <button
                                                onClick={toggleShuffle}
                                                className={`p-2 rounded-full transition-all ${
                                                    track.shuffleState
                                                        ? "text-[#1DB954]"
                                                        : "text-zinc-400 hover:text-white"
                                                }`}
                                                title="Modo aleatorio"
                                            >
                                                <Shuffle size={16} />
                                            </button>

                                            <button
                                                onClick={prevTrack}
                                                className="p-2 text-zinc-300 hover:text-white transition-all active:scale-95"
                                                title="Anterior"
                                            >
                                                <SkipBack size={22} fill="currentColor" />
                                            </button>

                                            <button
                                                onClick={togglePlay}
                                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                                                title={isPlaying ? "Pausar" : "Reproducir"}
                                            >
                                                {isPlaying ? (
                                                    <Pause size={22} fill="currentColor" />
                                                ) : (
                                                    <Play size={22} fill="currentColor" className="ml-0.5" />
                                                )}
                                            </button>

                                            <button
                                                onClick={nextTrack}
                                                className="p-2 text-zinc-300 hover:text-white transition-all active:scale-95"
                                                title="Siguiente"
                                            >
                                                <SkipForward size={22} fill="currentColor" />
                                            </button>

                                            <button
                                                onClick={toggleRepeat}
                                                className={`p-2 rounded-full transition-all ${
                                                    track.repeatState && track.repeatState !== "off"
                                                        ? "text-[#1DB954]"
                                                        : "text-zinc-400 hover:text-white"
                                                }`}
                                                title={`Repetir: ${track.repeatState || "off"}`}
                                            >
                                                {track.repeatState === "track" ? <Repeat1 size={17} /> : <Repeat size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-gradient-to-b from-white/[0.04] to-black/50 border border-white/10 rounded-3xl space-y-4 shadow-xl">
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954]">
                                        <Music size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-bold text-white">Spotify Conectado</h4>
                                        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                                            Tu cuenta está vinculada. Si ya tienes música sonando en Spotify en este momento, toca <strong>"Detectar Música"</strong> para vincularla al visualizador 3D.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2.5">
                                        <button
                                            type="button"
                                            onClick={handleDetectMusic}
                                            disabled={isDetecting}
                                            className="px-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all hover:bg-zinc-200"
                                        >
                                            <RefreshCw size={13} className={isDetecting ? "animate-spin text-black" : ""} />
                                            <span>{isDetecting ? "Detectando Música..." : "Detectar Música en iPhone"}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openSpotifyDeepLink("spotify:")}
                                            className="px-4 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
                                        >
                                            <Play size={13} fill="currentColor" />
                                            <span>Abrir App de Spotify</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* GUÍA RÁPIDA PARA IPHONE (SAFARI & CHROME) */}
                            {isIOSDevice() && (
                                <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                                        <Smartphone size={14} />
                                        <span>Guía de Conexión en iPhone</span>
                                    </div>
                                    <div className="text-[11px] text-zinc-300 space-y-1.5 leading-relaxed">
                                        <p>
                                            1. Abre tu app de Spotify y pon play a cualquier canción.
                                        </p>
                                        <p>
                                            2. Regresa a APEX y presiona <strong>"Detectar Música en iPhone"</strong> (o espera 2 segundos).
                                        </p>
                                        <p className="text-zinc-400 text-[10px] bg-white/[0.04] p-2.5 rounded-xl border border-white/10 mt-1">
                                            💡 <strong>Importante en iPhone:</strong> En tu app de Spotify ve a tu <em>Foto de perfil &gt; Configuración y privacidad &gt; Dispositivos</em> y activa <strong>"Estado de emisión del dispositivo"</strong> para que Spotify transmita tu música a APEX.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN: CANCIONES QUE SIGUEN EN LA LISTA DE REPRODUCCIÓN (QUEUE) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ListMusic size={15} className="text-[#1DB954]" />
                                        <span className="text-[11px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
                                            A CONTINUACIÓN EN COLA ({queue.length})
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadQueue}
                                        className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={10} />
                                        <span>Actualizar Cola</span>
                                    </button>
                                </div>

                                {queue.length > 0 ? (
                                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                        {queue.map((item, idx) => (
                                            <div
                                                key={`${item.id}-${idx}`}
                                                onClick={() => playQueueItem(item.uri)}
                                                className="group p-2 sm:p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-[#1DB954]/40 flex items-center justify-between gap-3 cursor-pointer transition-all"
                                                title="Haz clic para saltar a esta canción"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-[10px] font-mono text-zinc-500 w-4 text-center shrink-0">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
                                                        {item.albumArt ? (
                                                            <img
                                                                src={item.albumArt}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                                                <Music size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-semibold text-white group-hover:text-[#1DB954] transition-colors truncate block">
                                                            {item.name}
                                                        </span>
                                                        <span className="text-[11px] text-zinc-400 truncate block">
                                                            {item.artist}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                                                        {formatTime(item.durationMs)}
                                                    </span>
                                                    <div className="w-7 h-7 rounded-full bg-white/[0.08] group-hover:bg-[#1DB954] text-zinc-300 group-hover:text-black flex items-center justify-center transition-all">
                                                        <Play size={10} fill="currentColor" className="ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-zinc-400 flex items-center justify-between">
                                        <span>No hay más canciones pendientes en la cola activa.</span>
                                        <button
                                            onClick={loadQueue}
                                            className="text-xs text-[#1DB954] hover:underline font-mono"
                                        >
                                            Consultar Spotify
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Section: Dispositivos Detectados */}
                            <div className="pt-2 border-t border-white/[0.06] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                                        DISPOSITIVOS SPOTIFY ({devices.length})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={loadDevices}
                                        className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw size={10} className={isRefreshingDevices ? "animate-spin" : ""} />
                                        <span>Buscar</span>
                                    </button>
                                </div>

                                {devices.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {devices.map((dev) => {
                                            const Icon = getDeviceIcon(dev.type);
                                            const isSelected = selectedDeviceId === dev.id || dev.is_active;

                                            return (
                                                <div
                                                    key={dev.id}
                                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                                        dev.is_active
                                                            ? "bg-[#10B981]/15 border-[#10B981]/30 text-white"
                                                            : isSelected
                                                            ? "bg-white/[0.08] border-white/20 text-zinc-200"
                                                            : "bg-black/30 border-white/[0.05] text-zinc-400 hover:bg-white/[0.04]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <Icon size={16} className={dev.is_active ? "text-[#10B981]" : "text-zinc-400"} />
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-semibold truncate block">
                                                                    {dev.name}
                                                                </span>
                                                                {dev.is_active && (
                                                                    <span className="text-[9px] font-mono bg-[#10B981] text-black font-bold px-1.5 py-0.2 rounded-full uppercase">
                                                                        Activo
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] font-mono text-zinc-500 capitalize">
                                                                {dev.type.toLowerCase()} • {dev.volume_percent}% vol
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {!dev.is_active && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTransferDevice(dev.id)}
                                                            className="px-2.5 py-1 bg-white/[0.08] hover:bg-white text-white hover:text-black rounded-lg text-[10px] font-semibold border border-white/10 transition-all shrink-0 active:scale-95"
                                                        >
                                                            Reproducir aquí
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] text-xs text-zinc-400 space-y-2.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-white text-xs">Sin dispositivo activo detectado</span>
                                            <button
                                                type="button"
                                                onClick={() => openSpotifyDeepLink("spotify:")}
                                                className="px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                                            >
                                                <Smartphone size={13} />
                                                <span>Despertar Spotify</span>
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                                            En iPhone (Safari / Chrome), iOS suspende Spotify en segundo plano. Abre tu app de Spotify y dale Play a cualquier canción para que aparezca aquí tu iPhone.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Cuenta Vinculada & Desconexión */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                                <span className="text-xs text-zinc-400 font-mono">CUENTA VINCULADA</span>
                                <button
                                    onClick={handleDisconnect}
                                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-[#FF2A2A]/20 text-zinc-400 hover:text-[#FF2A2A] border border-white/10 hover:border-[#FF2A2A]/30 text-xs font-medium transition-all flex items-center gap-1.5"
                                >
                                    <LogOut size={12} />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Playlists de Entrenamiento Curadas */}
                    <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                                PLAYLISTS DE ENTRENAMIENTO PRECONFIGURADAS
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">1-TAP PLAY</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {CURATED_WORKOUT_PLAYLISTS.map((pl) => (
                                <div
                                    key={pl.id}
                                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.18] transition-all flex flex-col justify-between gap-3 group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <span
                                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                                                style={{
                                                    color: pl.accentColor,
                                                    borderColor: `${pl.accentColor}40`,
                                                    backgroundColor: `${pl.accentColor}15`
                                                }}
                                            >
                                                {pl.bpm}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-mono truncate">{pl.genre}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-white group-hover:text-[#1DB954] transition-colors leading-snug">
                                            {pl.name}
                                        </h4>
                                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                            {pl.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handlePlayPlaylist(pl)}
                                            disabled={!connected}
                                            className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                                                connected
                                                    ? "bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/10"
                                                    : "bg-white/[0.03] text-zinc-600 border border-white/[0.04] cursor-not-allowed"
                                            }`}
                                        >
                                            <Play size={12} fill="currentColor" />
                                            <span>{playingPlaylistId === pl.id ? "Iniciando..." : "Reproducir"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openSpotifyDeepLink(pl.spotifyUri, pl.webUrl)}
                                            title="Abrir directamente en la app de Spotify"
                                            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.06] transition-all flex items-center justify-center shrink-0 active:scale-95"
                                        >
                                            <ExternalLink size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Playlist URI or URL input */}
                    {connected && (
                        <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl space-y-2">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wide block">
                                O REPRODUCIR CUALQUIER OTRA PLAYLIST
                            </span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Pega enlace o URI de playlist de Spotify..."
                                    value={customUri}
                                    onChange={(e) => setCustomUri(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handlePlayCustom();
                                    }}
                                    className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30 font-mono h-9"
                                />
                                <button
                                    type="button"
                                    onClick={handlePlayCustom}
                                    className="h-9 px-4 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
                                >
                                    <Play size={12} fill="currentColor" />
                                    <span>Lanzar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/[0.08] bg-black/40 flex items-center justify-between text-xs text-zinc-500">
                    <span className="text-[10px] font-mono">APEX // SPOTIFY CLIENT</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-white rounded-xl text-xs font-medium transition-all"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
};
