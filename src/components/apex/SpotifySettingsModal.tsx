// src/components/apex/SpotifySettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    MoreVertical,
    ChevronLeft,
    Sliders,
    Zap,
    Flame
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
    SpotifyDevice,
    SpotifyQueueItem
} from "@/services/spotifyService";
import { useSpotifyPlayback } from "@/hooks/useSpotifyPlayback";
import { getInitialTheme, Theme } from "@/lib/theme";

interface SpotifySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: () => void;
}

type ModalView = "player" | "playlists" | "settings";

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

    const [theme, setTheme] = useState<Theme>("dark");
    const [currentView, setCurrentView] = useState<ModalView>("player");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
    const [playingSongUri, setPlayingSongUri] = useState<string | null>(null);
    const [customUri, setCustomUri] = useState("");
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
    const [fallbackPlaylist, setFallbackPlaylist] = useState<WorkoutPlaylist | null>(null);
    const [isDetecting, setIsDetecting] = useState(false);

    // Escuchar el cambio de tema para soportar Modo Claro y Modo Oscuro
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

    const isLight = theme === "light";

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
            setSuccessMsg("¡Sincronización completada!");
        } catch {
            setErrorMsg("No se detectó reproducción. Asegúrate de tener música sonando en Spotify.");
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
            setCurrentView("player");

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
            setSuccessMsg(`¡Reproduciendo "${playlist.name}"!`);
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
            setSuccessMsg("¡Iniciando reproducción!");
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

    const handlePlayQueueItem = async (item: SpotifyQueueItem) => {
        setPlayingSongUri(item.uri);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const result = await playQueueItem(item.uri, selectedDeviceId || undefined);
            if (result.success) {
                setSuccessMsg(`¡Reproduciendo "${item.name}"!`);
                setTimeout(() => {
                    loadDevices();
                    loadQueue();
                    refreshPlayback();
                }, 1000);
            } else {
                setErrorMsg(result.error || `No se pudo reproducir "${item.name}". Abre Spotify y reintenta.`);
            }
        } catch (err: any) {
            setErrorMsg(err?.message || "Error al solicitar reproducción de la pista.");
        } finally {
            setTimeout(() => setPlayingSongUri(null), 1200);
        }
    };

    const progressPct = track && track.durationMs > 0
        ? Math.min(100, Math.max(0, (progressMs / track.durationMs) * 100))
        : 0;

    return (
        /* Contenedor Flotante Orgánico:
           - z-40 para que la barra inferior (z-50) se siga viendo al frente.
           - pb-22 sm:pb-26 para anclarse suavemente arriba de la barra de donde salió.
           - Backdrop translúcido con blur para que la pantalla detrás se siga distinguiendo.
        */
        <div className="fixed inset-0 z-40 flex flex-col justify-end sm:justify-center p-2.5 sm:p-5 pb-22 sm:pb-26 animate-in fade-in duration-200">
            {/* Fondo Translúcido Interactivo (Cierra al dar tap afuera) */}
            <div
                onClick={onClose}
                className={`fixed inset-0 backdrop-blur-md transition-colors ${
                    isLight ? "bg-slate-900/30" : "bg-black/60"
                }`}
            />

            {/* Tarjeta Modal "Liquid Glass" */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 25, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className={`relative z-10 w-full max-w-lg mx-auto h-[82vh] sm:h-[84vh] max-h-[820px] rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
                    isLight
                        ? "bg-white/90 backdrop-blur-3xl border border-white/80 shadow-[0_25px_60px_rgba(15,23,42,0.22),inset_0_1px_1px_rgba(255,255,255,0.95)] text-slate-900"
                        : "bg-zinc-950/85 backdrop-blur-3xl border border-white/[0.15] shadow-[0_25px_60px_rgba(0,0,0,0.75),inset_0_1px_1px_rgba(255,255,255,0.2)] text-white"
                }`}
            >
                {/* Resplandor Especular Superior del Vidrio */}
                <div className={`absolute inset-x-8 top-0 h-[1.5px] pointer-events-none rounded-full z-20 ${
                    isLight
                        ? "bg-gradient-to-r from-transparent via-white/95 to-transparent"
                        : "bg-gradient-to-r from-transparent via-white/40 to-transparent"
                }`} />

                {/* 1. CABECERA UNIFICADA */}
                <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 transition-colors ${
                    isLight ? "border-slate-200/80 bg-white/50" : "border-white/[0.08] bg-black/20"
                }`}>
                    {currentView === "player" ? (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#1DB954] flex items-center justify-center text-black shadow-md shadow-[#1DB954]/25">
                                <Music size={16} fill="currentColor" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                        Spotify // APEX
                                    </h3>
                                    {connected && (
                                        <span className="text-[9px] font-mono px-2 py-0.2 rounded-full border bg-[#1DB954]/10 text-[#1DB954] border-[#1DB954]/30 font-bold">
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <p className={`text-[10px] sm:text-[11px] font-medium leading-tight ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                    Audio & Hipertrofia
                                </p>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCurrentView("player")}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 border ${
                                isLight
                                    ? "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200"
                                    : "bg-white/[0.08] hover:bg-white/[0.14] text-white border-white/10"
                            }`}
                        >
                            <ChevronLeft size={14} />
                            <span>Reproductor</span>
                        </button>
                    )}

                    {/* Acciones de Cabecera */}
                    <div className="flex items-center gap-2">
                        {/* Botón Destacado: Playlists para ti */}
                        <button
                            type="button"
                            onClick={() => setCurrentView(currentView === "playlists" ? "player" : "playlists")}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                                currentView === "playlists"
                                    ? (isLight ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-black border-white shadow-md")
                                    : (isLight ? "bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-200/90 shadow-xs" : "bg-white/[0.08] hover:bg-white/[0.15] text-zinc-200 border-white/10")
                            }`}
                            title="Playlists de entrenamiento por BPM"
                        >
                            <Zap size={13} className="text-[#1DB954]" fill="currentColor" />
                            <span className="hidden xs:inline">Playlists</span>
                            <span className="xs:hidden">Listas</span>
                        </button>

                        {/* Botón de 3 puntos (...) para Funciones Avanzadas */}
                        {connected && (
                            <button
                                type="button"
                                onClick={() => setCurrentView(currentView === "settings" ? "player" : "settings")}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                                    currentView === "settings"
                                        ? (isLight ? "bg-slate-900 text-white border-slate-900" : "bg-white text-black border-white")
                                        : (isLight ? "bg-slate-100/90 hover:bg-slate-200 text-slate-700 border-slate-200/90" : "bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 hover:text-white border-white/10")
                                }`}
                                title="Opciones avanzadas (Dispositivos, Cola, Desconexión)"
                                aria-label="Opciones avanzadas"
                            >
                                <MoreVertical size={15} />
                            </button>
                        )}

                        {/* Botón Cerrar */}
                        <button
                            type="button"
                            onClick={onClose}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 border ${
                                isLight
                                    ? "bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200/90"
                                    : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white border-white/10"
                            }`}
                            aria-label="Cerrar modal"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Banner de Mensajes (Error / Éxito) */}
                <div className="shrink-0 px-4 pt-2">
                    {errorMsg && (
                        <div className={`p-3 rounded-2xl flex items-start gap-2.5 text-xs animate-in fade-in border ${
                            isLight
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}>
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold leading-tight">{errorMsg}</p>
                                {fallbackPlaylist && (
                                    <button
                                        type="button"
                                        onClick={() => openSpotifyDeepLink(fallbackPlaylist.spotifyUri, fallbackPlaylist.webUrl)}
                                        className="mt-1.5 px-3 py-1 bg-[#1DB954] text-black font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 active:scale-95"
                                    >
                                        <ExternalLink size={12} />
                                        <span>Abrir en Spotify</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {successMsg && (
                        <div className={`p-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in border ${
                            isLight
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}>
                            <Check size={14} />
                            <span>{successMsg}</span>
                        </div>
                    )}
                </div>

                {/* 2. CUERPO DEL REPRODUCTOR (CON INTERCAMBIO DE VISTAS) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    {/* SI NO ESTÁ CONECTADO: Pantalla de Login limpia & elegante */}
                    {!connected ? (
                        <div className={`rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-lg border transition-all ${
                            isLight
                                ? "bg-slate-50/80 border-slate-200/80"
                                : "bg-gradient-to-b from-white/[0.04] to-black/50 border-white/10"
                        }`}>
                            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1DB954] flex items-center justify-center text-black shadow-xl shadow-[#1DB954]/30">
                                <Disc size={32} className="animate-spin-slow" />
                            </div>
                            <div className="space-y-1.5 max-w-sm mx-auto">
                                <h4 className={`text-base sm:text-lg font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                    Sincroniza tus Sesiones con Spotify
                                </h4>
                                <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                                    Controla la música de tus series pesadas, sincroniza los BPMs con tu ritmo motor y visualiza la carátula en alta definición.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="w-full py-3.5 px-6 rounded-2xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40 cursor-pointer"
                            >
                                <Music size={18} fill="currentColor" />
                                <span>{isConnecting ? "Conectando con Spotify..." : "Conectar con Spotify"}</span>
                            </button>

                            {/* Opcional: Escuchar playlists directamente en la app */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentView("playlists")}
                                    className={`text-xs font-semibold underline underline-offset-4 cursor-pointer ${
                                        isLight ? "text-slate-700 hover:text-slate-950" : "text-zinc-300 hover:text-white"
                                    }`}
                                >
                                    O explora las playlists de entrenamiento curadas →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            {/* VISTA 1: REPRODUCTOR PRINCIPAL (ENFOCADO EN CARÁTULA E INFO) */}
                            {currentView === "player" && (
                                <motion.div
                                    key="player-view"
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5"
                                >
                                    {/* Ambient Glow reactivo al color del álbum */}
                                    <div
                                        className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-48 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
                                        style={{ backgroundColor: `rgb(${accentRgb || "29, 185, 84"})` }}
                                    />

                                    {/* CARÁTULA DEL ÁLBUM GRANDE */}
                                    <div className="relative z-10">
                                        <div className={`relative w-48 h-48 sm:w-60 sm:h-60 rounded-3xl overflow-hidden border shadow-2xl transition-all duration-500 group ${
                                            isLight ? "bg-slate-100 border-slate-200/90 shadow-slate-300/60" : "bg-zinc-900 border-white/20 shadow-black/80"
                                        }`}>
                                            {track?.albumArt ? (
                                                <img
                                                    src={track.albumArt}
                                                    alt={track.album || "Album artwork"}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#1DB954]">
                                                    <Music size={48} />
                                                    <span className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                        Sin pista activa
                                                    </span>
                                                </div>
                                            )}

                                            {/* Insignia LIVE o Reposo */}
                                            {isPlaying ? (
                                                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-mono text-[#10B981] flex items-center gap-1.5 shadow-md">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                                                    <span className="font-bold">SONANDO</span>
                                                </div>
                                            ) : track?.isRecentlyPlayed ? (
                                                <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/40 text-[9px] font-mono text-amber-400 flex items-center gap-1.5 shadow-md">
                                                    <span>PAUSADA</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* INFO DE LA CANCIÓN: Título, Artista y Telemetría */}
                                    <div className="relative z-10 w-full px-2 max-w-sm">
                                        <h3 className={`text-base sm:text-lg font-bold tracking-tight truncate leading-tight ${
                                            isLight ? "text-slate-900" : "text-white"
                                        }`} title={track?.name || "Sin reproducción"}>
                                            {track?.name || "No hay reproducción activa"}
                                        </h3>
                                        <p className={`text-xs sm:text-sm font-medium mt-1 truncate leading-tight ${
                                            isLight ? "text-slate-600" : "text-zinc-400"
                                        }`} title={track?.artist || "Spotify"}>
                                            {track?.artist || "Abre Spotify o selecciona una playlist"}
                                        </p>

                                        {/* Badges de Telemetría: BPM y Dispositivo */}
                                        <div className="flex items-center justify-center gap-2 mt-2.5 flex-wrap">
                                            {bpm > 0 && (
                                                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                                    isLight
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                                                }`}>
                                                    <Zap size={11} fill="currentColor" />
                                                    <span>{Math.round(bpm)} BPM</span>
                                                </span>
                                            )}

                                            {track?.deviceName ? (
                                                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                                                    isLight
                                                        ? "bg-slate-100 text-slate-700 border-slate-200"
                                                        : "bg-white/[0.08] text-zinc-300 border-white/10"
                                                }`}>
                                                    <Speaker size={11} className="text-[#1DB954]" />
                                                    <span className="truncate max-w-[120px]">{track.deviceName}</span>
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                                                    isLight
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                                                }`}>
                                                    En espera de audio
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* BARRA DE PROGRESO (SCRUBBER) */}
                                    <div className="w-full max-w-sm space-y-1.5 pt-1 relative z-10">
                                        <div className="relative w-full flex items-center group py-1">
                                            <div className={`w-full h-1.5 rounded-full overflow-hidden relative ${
                                                isLight ? "bg-slate-200" : "bg-white/[0.15]"
                                            }`}>
                                                <div
                                                    className={`h-full transition-colors rounded-full ${
                                                        isLight ? "bg-slate-900 group-hover:bg-[#1DB954]" : "bg-white group-hover:bg-[#1DB954]"
                                                    }`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={track?.durationMs || 100}
                                                value={progressMs}
                                                onChange={(e) => seekTo(parseInt(e.target.value, 10))}
                                                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                                aria-label="Posición de reproducción"
                                            />
                                        </div>
                                        <div className={`flex items-center justify-between text-[10px] font-mono ${
                                            isLight ? "text-slate-500" : "text-zinc-400"
                                        }`}>
                                            <span>{formatTime(progressMs)}</span>
                                            <span>{formatTime(track?.durationMs || 0)}</span>
                                        </div>
                                    </div>

                                    {/* CONTROLES DE REPRODUCCIÓN PRINCIPALES */}
                                    <div className="flex items-center justify-center gap-5 sm:gap-7 pt-1 relative z-10">
                                        {/* Aleatorio */}
                                        <button
                                            type="button"
                                            onClick={toggleShuffle}
                                            className={`p-2 rounded-full transition-all cursor-pointer active:scale-95 ${
                                                track?.shuffleState
                                                    ? "text-[#1DB954]"
                                                    : (isLight ? "text-slate-400 hover:text-slate-800" : "text-zinc-400 hover:text-white")
                                            }`}
                                            title="Modo aleatorio"
                                        >
                                            <Shuffle size={17} />
                                        </button>

                                        {/* Anterior */}
                                        <button
                                            type="button"
                                            onClick={prevTrack}
                                            className={`p-2 transition-all cursor-pointer active:scale-95 ${
                                                isLight ? "text-slate-700 hover:text-slate-950" : "text-zinc-300 hover:text-white"
                                            }`}
                                            title="Pista anterior"
                                        >
                                            <SkipBack size={24} fill="currentColor" />
                                        </button>

                                        {/* Play / Pause Principal */}
                                        <button
                                            type="button"
                                            onClick={togglePlay}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                                isLight
                                                    ? "bg-slate-900 text-white hover:bg-black shadow-slate-400/40"
                                                    : "bg-white text-black hover:bg-zinc-200 shadow-black/80"
                                            }`}
                                            title={isPlaying ? "Pausar" : "Reproducir"}
                                        >
                                            {isPlaying ? (
                                                <Pause size={24} fill="currentColor" />
                                            ) : (
                                                <Play size={24} fill="currentColor" className="ml-1" />
                                            )}
                                        </button>

                                        {/* Siguiente */}
                                        <button
                                            type="button"
                                            onClick={nextTrack}
                                            className={`p-2 transition-all cursor-pointer active:scale-95 ${
                                                isLight ? "text-slate-700 hover:text-slate-950" : "text-zinc-300 hover:text-white"
                                            }`}
                                            title="Siguiente pista"
                                        >
                                            <SkipForward size={24} fill="currentColor" />
                                        </button>

                                        {/* Repetir */}
                                        <button
                                            type="button"
                                            onClick={toggleRepeat}
                                            className={`p-2 rounded-full transition-all cursor-pointer active:scale-95 ${
                                                track?.repeatState && track.repeatState !== "off"
                                                    ? "text-[#1DB954]"
                                                    : (isLight ? "text-slate-400 hover:text-slate-800" : "text-zinc-400 hover:text-white")
                                            }`}
                                            title={`Repetir: ${track?.repeatState || "off"}`}
                                        >
                                            {track?.repeatState === "track" ? <Repeat1 size={18} /> : <Repeat size={17} />}
                                        </button>
                                    </div>

                                    {/* BANNER INFERIOR: ACCESO RÁPIDO A PLAYLISTS */}
                                    <div className="w-full max-w-sm pt-2 relative z-10">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentView("playlists")}
                                            className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between gap-2 transition-all cursor-pointer active:scale-98 border ${
                                                isLight
                                                    ? "bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 border-emerald-200/80 shadow-xs"
                                                    : "bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-white border-[#1DB954]/30"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Zap size={14} className="text-[#1DB954]" fill="currentColor" />
                                                <span className="text-xs font-bold">Playlists para ti (BPM Hub)</span>
                                            </div>
                                            <span className={`text-[10px] font-mono font-semibold ${isLight ? "text-emerald-700" : "text-[#1DB954]"}`}>
                                                VER TODAS →
                                            </span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* VISTA 2: "PLAYLISTS PARA TI" (MENÚ PADRE Y PROFESIONAL CON BPMS Y PLAY DIRECTO) */}
                            {currentView === "playlists" && (
                                <motion.div
                                    key="playlists-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4"
                                >
                                    {/* Encabezado del Menú Padre */}
                                    <div className="flex items-center justify-between pb-1">
                                        <div>
                                            <h4 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                                Playlists de Entrenamiento
                                            </h4>
                                            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                Optimizadas por BPMs y cadencia neuromuscular para hipertrofia.
                                            </p>
                                        </div>
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                            isLight ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-white/[0.06] text-zinc-400 border-white/10"
                                        }`}>
                                            1-TAP PLAY
                                        </span>
                                    </div>

                                    {/* Grid de Tarjetas de Playlists Profesionales */}
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {CURATED_WORKOUT_PLAYLISTS.map((pl) => {
                                            const isThisPlaying = playingPlaylistId === pl.id;

                                            return (
                                                <div
                                                    key={pl.id}
                                                    className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 group ${
                                                        isLight
                                                            ? "bg-slate-50/90 hover:bg-white border-slate-200/90 shadow-xs hover:shadow-md"
                                                            : "bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-white/20"
                                                    }`}
                                                >
                                                    {/* Información de la Playlist & BPM */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {/* BPM Pill Badge Destacado */}
                                                            <span
                                                                className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
                                                                style={{
                                                                    color: pl.accentColor,
                                                                    borderColor: `${pl.accentColor}50`,
                                                                    backgroundColor: `${pl.accentColor}18`
                                                                }}
                                                            >
                                                                <Zap size={10} fill="currentColor" />
                                                                <span>{pl.bpm}</span>
                                                            </span>

                                                            <span className={`text-[10px] font-mono truncate ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                                {pl.genre}
                                                            </span>
                                                        </div>

                                                        <h5 className={`text-xs sm:text-sm font-bold tracking-tight truncate ${
                                                            isLight ? "text-slate-900 group-hover:text-emerald-600" : "text-white group-hover:text-[#1DB954]"
                                                        } transition-colors`}>
                                                            {pl.name}
                                                        </h5>

                                                        <p className={`text-[10px] sm:text-[11px] mt-0.5 line-clamp-1 leading-tight ${
                                                            isLight ? "text-slate-600" : "text-zinc-400"
                                                        }`}>
                                                            {pl.description}
                                                        </p>
                                                    </div>

                                                    {/* Botones de Acción: Play Directo + Enlace App */}
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {/* Botón Play Directo */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePlayPlaylist(pl)}
                                                            disabled={!connected}
                                                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm ${
                                                                isThisPlaying
                                                                    ? "bg-[#1DB954] text-black"
                                                                    : connected
                                                                    ? (isLight
                                                                        ? "bg-slate-900 hover:bg-black text-white hover:shadow-md"
                                                                        : "bg-white/[0.1] hover:bg-white text-white hover:text-black border border-white/10")
                                                                    : (isLight
                                                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                                        : "bg-white/[0.04] text-zinc-600 cursor-not-allowed")
                                                            }`}
                                                            title={connected ? `Reproducir ${pl.name}` : "Conecta Spotify primero"}
                                                        >
                                                            {isThisPlaying ? (
                                                                <RefreshCw size={12} className="animate-spin text-black" />
                                                            ) : (
                                                                <Play size={12} fill="currentColor" className="ml-0.5" />
                                                            )}
                                                            <span>{isThisPlaying ? "Cargando..." : "Play"}</span>
                                                        </button>

                                                        {/* Botón Abrir en App de Spotify */}
                                                        <button
                                                            type="button"
                                                            onClick={() => openSpotifyDeepLink(pl.spotifyUri, pl.webUrl)}
                                                            title="Abrir en la app de Spotify"
                                                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-90 border ${
                                                                isLight
                                                                    ? "bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
                                                                    : "bg-white/[0.05] hover:bg-white/[0.12] text-zinc-400 hover:text-white border-white/10"
                                                            }`}
                                                        >
                                                            <ExternalLink size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* VISTA 3: OPCIONES AVANZADAS (DISPOSITIVOS, COLA, ENLACES PERSONALIZADOS, GUÍA IPHONE) */}
                            {currentView === "settings" && (
                                <motion.div
                                    key="settings-view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Encabezado */}
                                    <div className="flex items-center justify-between pb-1">
                                        <div>
                                            <h4 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                                                Ajustes Avanzados de Audio
                                            </h4>
                                            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                Control de dispositivos, cola y sincronización local.
                                            </p>
                                        </div>
                                    </div>

                                    {/* DISPOSITIVOS SPOTIFY DETECTADOS */}
                                    <div className={`p-4 rounded-2xl border space-y-3 ${
                                        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-white/[0.03] border-white/[0.08]"
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                                                isLight ? "text-slate-600" : "text-zinc-400"
                                            }`}>
                                                DISPOSITIVOS DETECTADOS ({devices.length})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={loadDevices}
                                                className={`text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                                                    isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white"
                                                }`}
                                            >
                                                <RefreshCw size={10} className={isRefreshingDevices ? "animate-spin" : ""} />
                                                <span>Actualizar</span>
                                            </button>
                                        </div>

                                        {devices.length > 0 ? (
                                            <div className="space-y-2">
                                                {devices.map((dev) => {
                                                    const Icon = getDeviceIcon(dev.type);
                                                    const isSelected = selectedDeviceId === dev.id || dev.is_active;

                                                    return (
                                                        <div
                                                            key={dev.id}
                                                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                                                                dev.is_active
                                                                    ? (isLight
                                                                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                                                                        : "bg-[#10B981]/15 border-[#10B981]/30 text-white")
                                                                    : (isLight
                                                                        ? "bg-white border-slate-200 text-slate-800"
                                                                        : "bg-black/30 border-white/[0.06] text-zinc-300")
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <Icon size={16} className={dev.is_active ? "text-[#10B981]" : (isLight ? "text-slate-500" : "text-zinc-400")} />
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
                                                                    <span className={`text-[10px] font-mono capitalize ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                                                        {dev.type.toLowerCase()} • {dev.volume_percent}% vol
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {!dev.is_active && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTransferDevice(dev.id)}
                                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all shrink-0 active:scale-95 cursor-pointer ${
                                                                        isLight
                                                                            ? "bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 border-slate-300"
                                                                            : "bg-white/[0.08] hover:bg-white text-white hover:text-black border-white/10"
                                                                    }`}
                                                                >
                                                                    Pasar aquí
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-2 space-y-2">
                                                <p className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                    No hay dispositivos activos de Spotify detectados.
                                                </p>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleDetectMusic}
                                                        disabled={isDetecting}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 border active:scale-95 cursor-pointer ${
                                                            isLight
                                                                ? "bg-slate-100 text-slate-800 border-slate-300"
                                                                : "bg-white/[0.08] text-white border-white/10"
                                                        }`}
                                                    >
                                                        <RefreshCw size={12} className={isDetecting ? "animate-spin" : ""} />
                                                        <span>Detectar Música</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openSpotifyDeepLink("spotify:")}
                                                        className="px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-xl flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                                                    >
                                                        <Smartphone size={12} />
                                                        <span>Despertar App</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* COLA DE REPRODUCCIÓN (QUEUE) */}
                                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                                        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-white/[0.03] border-white/[0.08]"
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                                                isLight ? "text-slate-600" : "text-zinc-400"
                                            }`}>
                                                A CONTINUACIÓN EN COLA ({queue.length})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={loadQueue}
                                                className={`text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                                                    isLight ? "text-slate-600 hover:text-slate-950" : "text-zinc-400 hover:text-white"
                                                }`}
                                            >
                                                <RefreshCw size={10} />
                                                <span>Actualizar</span>
                                            </button>
                                        </div>

                                        {queue.length > 0 ? (
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                                {queue.slice(0, 10).map((item, idx) => (
                                                    <div
                                                        key={`${item.id}-${idx}`}
                                                        onClick={() => handlePlayQueueItem(item)}
                                                        className={`p-2 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all active:scale-[0.99] ${
                                                            isLight
                                                                ? "bg-white hover:bg-slate-100 border-slate-200/80"
                                                                : "bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.05]"
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className={`text-[10px] font-mono w-4 text-center shrink-0 ${
                                                                isLight ? "text-slate-400" : "text-zinc-500"
                                                            }`}>
                                                                {idx + 1}
                                                            </span>
                                                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10">
                                                                {item.albumArt ? (
                                                                    <img src={item.albumArt} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                                                                        <Music size={12} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className={`text-xs font-semibold truncate block ${isLight ? "text-slate-900" : "text-white"}`}>
                                                                    {item.name}
                                                                </span>
                                                                <span className={`text-[10px] truncate block ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                                    {item.artist}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="shrink-0">
                                                            {playingSongUri === item.uri ? (
                                                                <RefreshCw size={12} className="animate-spin text-[#1DB954]" />
                                                            ) : (
                                                                <Play size={11} fill="currentColor" className={isLight ? "text-slate-600" : "text-zinc-400"} />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-xs py-1 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                                No hay canciones pendientes en la cola activa.
                                            </p>
                                        )}
                                    </div>

                                    {/* REPRODUCIR CUALQUIER LINK / URI PERSONALIZADA */}
                                    <div className={`p-4 rounded-2xl border space-y-2.5 ${
                                        isLight ? "bg-slate-50/80 border-slate-200/80" : "bg-white/[0.03] border-white/[0.08]"
                                    }`}>
                                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold block ${
                                            isLight ? "text-slate-600" : "text-zinc-400"
                                        }`}>
                                            LANZAR ENLACE O URI DE SPOTIFY
                                        </span>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Pega link o URI de canción o playlist..."
                                                value={customUri}
                                                onChange={(e) => setCustomUri(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handlePlayCustom();
                                                }}
                                                className={`flex-1 rounded-xl px-3 text-xs outline-none font-mono h-9 border transition-colors ${
                                                    isLight
                                                        ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-800"
                                                        : "bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-white/30"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePlayCustom}
                                                className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                                    isLight
                                                        ? "bg-slate-900 hover:bg-black text-white"
                                                        : "bg-white text-black hover:bg-zinc-200"
                                                }`}
                                            >
                                                <Play size={11} fill="currentColor" />
                                                <span>Lanzar</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* GUÍA IPHONE & SEGUNDO PLANO */}
                                    {isIOSDevice() && (
                                        <div className={`p-3.5 rounded-2xl border space-y-1.5 text-xs ${
                                            isLight ? "bg-amber-50/80 border-amber-200 text-amber-900" : "bg-amber-400/10 border-amber-400/20 text-amber-300"
                                        }`}>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <Smartphone size={13} />
                                                <span>Tip para iPhone (iOS)</span>
                                            </div>
                                            <p className={`text-[11px] leading-relaxed ${isLight ? "text-amber-800" : "text-zinc-300"}`}>
                                                Si Spotify se suspende en segundo plano, abre tu app de Spotify, pon play a cualquier tema y regresa. En la app ve a <em>Configuración &gt; Dispositivos</em> y activa <strong>"Estado de emisión del dispositivo"</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {/* CERRAR SESIÓN */}
                                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/50">
                                        <span className={`text-xs font-mono ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                                            CUENTA VINCULADA
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleDisconnect}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border cursor-pointer ${
                                                isLight
                                                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                                    : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                                            }`}
                                        >
                                            <LogOut size={12} />
                                            <span>Cerrar sesión de Spotify</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* 3. FOOTER DISCRETO */}
                <div className={`p-3 sm:p-4 border-t flex items-center justify-between text-xs shrink-0 transition-colors ${
                    isLight ? "border-slate-200/80 bg-white/50 text-slate-500" : "border-white/[0.08] bg-black/20 text-zinc-500"
                }`}>
                    <span className="text-[10px] font-mono">
                        APEX // SPOTIFY CLIENT
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isLight
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                                : "bg-white/[0.08] hover:bg-white/[0.15] text-white"
                        }`}
                    >
                        Listo
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
