// src/components/apex/SpotifySettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Music,
    Play,
    Check,
    LogOut,
    Sparkles,
    Disc,
    Radio,
    Speaker,
    ExternalLink
} from "lucide-react";
import {
    isSpotifyConnected,
    initiateSpotifyLogin,
    disconnectSpotify,
    CURATED_WORKOUT_PLAYLISTS,
    WorkoutPlaylist,
    spotifyPlayPlaylist,
    getCurrentPlayback,
    SpotifyTrack
} from "@/services/spotifyService";

interface SpotifySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: () => void;
}

export const SpotifySettingsModal: React.FC<SpotifySettingsModalProps> = ({
    isOpen,
    onClose,
    onStatusChange
}) => {
    const [connected, setConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
    const [customUri, setCustomUri] = useState("");
    const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);

    useEffect(() => {
        if (isOpen) {
            const isConn = isSpotifyConnected();
            setConnected(isConn);
            setErrorMsg(null);
            setIsConnecting(false);

            if (isConn) {
                getCurrentPlayback().then(track => setCurrentTrack(track));
            }
        }
    }, [isOpen]);

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
        setConnected(false);
        setCurrentTrack(null);
        if (onStatusChange) onStatusChange();
    };

    const handlePlayPlaylist = async (playlist: WorkoutPlaylist) => {
        setPlayingPlaylistId(playlist.id);
        const success = await spotifyPlayPlaylist(playlist.spotifyUri);
        if (!success) {
            setErrorMsg("Abre Spotify en tu teléfono, computadora o auriculares para recibir la reproducción.");
        }
        setTimeout(() => setPlayingPlaylistId(null), 1500);
    };

    const handlePlayCustom = async () => {
        if (!customUri.trim()) return;
        let formatted = customUri.trim();
        if (formatted.includes("spotify.com/playlist/")) {
            const id = formatted.split("playlist/")[1]?.split("?")[0];
            if (id) formatted = `spotify:playlist:${id}`;
        }
        const success = await spotifyPlayPlaylist(formatted);
        if (!success) {
            setErrorMsg("Asegúrate de que Spotify esté abierto y activo en algún dispositivo.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#121214] border border-white/[0.12] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
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
                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="p-3.5 bg-[#FF2A2A]/10 border border-[#FF2A2A]/30 rounded-2xl text-xs text-[#FF2A2A] leading-relaxed">
                            {errorMsg}
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
                                    Conéctate con tu cuenta para ver la carátula en vivo, controlar reproducción y activar cadencias de alta intensidad.
                                </p>
                            </div>

                            {/* Botón Oficial Directo de Login */}
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
                        <div className="bg-[#1DB954]/5 border border-[#1DB954]/20 rounded-3xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                                    <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
                                        CUENTA VINCULADA
                                    </span>
                                </div>
                                <button
                                    onClick={handleDisconnect}
                                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-[#FF2A2A]/20 text-zinc-400 hover:text-[#FF2A2A] border border-white/10 hover:border-[#FF2A2A]/30 text-xs font-medium transition-all flex items-center gap-1.5"
                                >
                                    <LogOut size={12} />
                                    <span>Cerrar sesión</span>
                                </button>
                            </div>

                            {/* Active Device & Track Status */}
                            {currentTrack && (
                                <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
                                    {currentTrack.albumArt ? (
                                        <img
                                            src={currentTrack.albumArt}
                                            alt={currentTrack.name}
                                            className="w-12 h-12 rounded-xl object-cover border border-white/10"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-[#1DB954]">
                                            <Music size={20} />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-bold text-white truncate block">
                                            {currentTrack.name}
                                        </span>
                                        <span className="text-[11px] text-zinc-400 truncate block">
                                            {currentTrack.artist}
                                        </span>
                                        {currentTrack.deviceName && (
                                            <span className="text-[10px] font-mono text-[#10B981] flex items-center gap-1 mt-0.5">
                                                <Speaker size={10} />
                                                {currentTrack.deviceName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Curated Workout Playlists */}
                    <div className="space-y-3">
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

                                    <button
                                        onClick={() => handlePlayPlaylist(pl)}
                                        disabled={!connected}
                                        className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                            connected
                                                ? "bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/10"
                                                : "bg-white/[0.03] text-zinc-600 border border-white/[0.04] cursor-not-allowed"
                                        }`}
                                    >
                                        <Play size={12} fill="currentColor" />
                                        <span>{playingPlaylistId === pl.id ? "Iniciando..." : "Reproducir en Spotify"}</span>
                                    </button>
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
                                    placeholder="Pega un enlace de playlist de Spotify..."
                                    value={customUri}
                                    onChange={(e) => setCustomUri(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/30"
                                />
                                <button
                                    onClick={handlePlayCustom}
                                    className="px-3.5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-zinc-200 transition-all active:scale-95 shrink-0"
                                >
                                    Lanzar
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
