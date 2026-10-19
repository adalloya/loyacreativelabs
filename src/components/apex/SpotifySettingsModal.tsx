// src/components/apex/SpotifySettingsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
    X,
    Music,
    Radio,
    Play,
    ExternalLink,
    Check,
    LogOut,
    Key,
    HelpCircle,
    Flame,
    Zap,
    Sparkles,
    Disc
} from "lucide-react";
import {
    getStoredSpotifyClientId,
    setStoredSpotifyClientId,
    isSpotifyConnected,
    initiateSpotifyLogin,
    disconnectSpotify,
    CURATED_WORKOUT_PLAYLISTS,
    WorkoutPlaylist,
    spotifyPlayPlaylist
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
    const [clientId, setClientId] = useState("");
    const [connected, setConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
    const [customUri, setCustomUri] = useState("");

    useEffect(() => {
        if (isOpen) {
            setClientId(getStoredSpotifyClientId());
            setConnected(isSpotifyConnected());
            setErrorMsg(null);
            setIsConnecting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConnect = async () => {
        setErrorMsg(null);
        if (!clientId.trim()) {
            setErrorMsg("Ingresa tu Client ID de Spotify Developer antes de continuar.");
            return;
        }

        try {
            setIsConnecting(true);
            setStoredSpotifyClientId(clientId.trim());
            await initiateSpotifyLogin(clientId.trim());
        } catch (err: any) {
            setErrorMsg(err.message || "Error al iniciar conexión con Spotify.");
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnectSpotify();
        setConnected(false);
        if (onStatusChange) onStatusChange();
    };

    const handlePlayPlaylist = async (playlist: WorkoutPlaylist) => {
        setPlayingPlaylistId(playlist.id);
        const success = await spotifyPlayPlaylist(playlist.spotifyUri);
        if (!success) {
            setErrorMsg("Abre Spotify en tu teléfono o computadora para que el reproductor reciba la señal de reproducción.");
        }
        setTimeout(() => setPlayingPlaylistId(null), 1500);
    };

    const handlePlayCustom = async () => {
        if (!customUri.trim()) return;
        let formatted = customUri.trim();
        // Permite pegar enlaces de spotify.com o URIs directos
        if (formatted.includes("spotify.com/playlist/")) {
            const id = formatted.split("playlist/")[1]?.split("?")[0];
            if (id) formatted = `spotify:playlist:${id}`;
        }
        const success = await spotifyPlayPlaylist(formatted);
        if (!success) {
            setErrorMsg("Asegúrate de que Spotify esté abierto y reproduciendo activamente en algún dispositivo.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
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
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-black/40 text-zinc-400 border-white/10">
                                    PKCE OAUTH
                                </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Sincroniza el ritmo de tus entrenamientos con tu cuenta de Spotify.
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

                    {/* Status & Client ID Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                                ESTADO DE CONEXIÓN
                            </span>
                            <span
                                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                                    connected
                                        ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                                        : "bg-white/[0.05] text-zinc-400 border-white/10"
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#10B981] animate-pulse" : "bg-zinc-500"}`} />
                                {connected ? "CONECTADO A SPOTIFY" : "NO CONECTADO"}
                            </span>
                        </div>

                        {!connected ? (
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                                            <Key size={13} className="text-[#1DB954]" />
                                            <span>Spotify Client ID</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowHelp(!showHelp)}
                                            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 underline"
                                        >
                                            <HelpCircle size={12} />
                                            <span>¿Cómo obtenerlo?</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="ej. a1b2c3d4e5f67890123456789abcdef0"
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        className="w-full bg-black/50 border border-white/[0.1] focus:border-[#1DB954]/60 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-zinc-600 outline-none transition-all"
                                    />
                                </div>

                                {showHelp && (
                                    <div className="p-3 bg-black/60 border border-white/[0.06] rounded-xl text-[11px] text-zinc-300 space-y-1.5 leading-relaxed">
                                        <p className="font-semibold text-white">Pasos para tu Client ID (gratis en 1 minuto):</p>
                                        <ol className="list-decimal list-inside space-y-1 text-zinc-400 font-mono text-[10px]">
                                            <li>Entra a <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-[#1DB954] underline">developer.spotify.com/dashboard</a>.</li>
                                            <li>Haz clic en <strong>Create app</strong>.</li>
                                            <li>En <strong>Redirect URIs</strong>, agrega exactamente:
                                                <code className="block text-white bg-white/10 p-1 rounded mt-0.5 truncate">
                                                    {typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "http://localhost:3000/apex"}
                                                </code>
                                            </li>
                                            <li>Guarda la app, copia el <strong>Client ID</strong> y pégalo arriba.</li>
                                        </ol>
                                    </div>
                                )}

                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="w-full py-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg shadow-[#1DB954]/20"
                                >
                                    <Disc size={15} />
                                    <span>{isConnecting ? "Conectando con Spotify..." : "Conectar Spotify (OAuth PKCE)"}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-[#1DB954]/5 border border-[#1DB954]/20 rounded-2xl p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-[#1DB954]/20 flex items-center justify-center text-[#1DB954]">
                                        <Check size={16} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-white block">Cuenta vinculada</span>
                                        <span className="text-[11px] text-zinc-400">Control de reproducción en vivo habilitado</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDisconnect}
                                    className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-[#FF2A2A]/20 text-zinc-400 hover:text-[#FF2A2A] border border-white/10 hover:border-[#FF2A2A]/30 text-xs font-medium transition-all flex items-center gap-1.5"
                                >
                                    <LogOut size={12} />
                                    <span>Desvincular</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Curated Workout Playlists (140 BPM, Fuerza, Recuperación) */}
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
                    <span className="text-[10px] font-mono">APEX // SPOTIFY INTEGRATION</span>
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
