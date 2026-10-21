// src/hooks/useSpotifyPlayback.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    isSpotifyConnected,
    getCurrentPlayback,
    getLastKnownTrack,
    getTrackAudioFeatures,
    getSpotifyQueue,
    spotifyPlay,
    spotifyPause,
    spotifyNext,
    spotifyPrevious,
    spotifySeek,
    spotifySetShuffle,
    spotifySetRepeat,
    spotifySetVolume,
    spotifyPlayTrack,
    openSpotifyDeepLink,
    isIOSDevice,
    SpotifyTrack,
    SpotifyQueueItem,
    AudioFeatures
} from "@/services/spotifyService";
import { extractAlbumAccentColor } from "@/services/spotifyTelemetry";

const SYNC_EVENT = "apex:spotify-sync";

// Estado global en memoria para sincronización instantánea entre componentes
let globalState = {
    connected: false,
    track: null as SpotifyTrack | null,
    isPlaying: false,
    bpm: 135,
    energy: 0.85,
    accentRgb: "255, 42, 42",
    progressMs: 0,
    queue: [] as SpotifyQueueItem[],
};

export function useSpotifyPlayback() {
    const [connected, setConnected] = useState(globalState.connected);
    const [track, setTrack] = useState<SpotifyTrack | null>(globalState.track);
    const [isPlaying, setIsPlaying] = useState<boolean>(globalState.isPlaying);
    const [bpm, setBpm] = useState<number>(globalState.bpm);
    const [energy, setEnergy] = useState<number>(globalState.energy);
    const [accentRgb, setAccentRgb] = useState<string>(globalState.accentRgb);
    const [progressMs, setProgressMs] = useState<number>(globalState.progressMs);
    const [queue, setQueue] = useState<SpotifyQueueItem[]>(globalState.queue);
    const [isSeeking, setIsSeeking] = useState(false);
    const [volume, setVolumeState] = useState<number>(100);
    const [isMuted, setIsMuted] = useState(false);
    const prevVolumeRef = useRef(100);

    const isMountedRef = useRef(true);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const tickerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Notificar a todos los componentes suscriptores en la ventana
    const broadcastState = useCallback((partial: Partial<typeof globalState>) => {
        globalState = { ...globalState, ...partial };
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: globalState }));
        }
    }, []);

    // Carga de cola de reproducción
    const loadQueue = useCallback(async () => {
        if (!isSpotifyConnected()) {
            setQueue([]);
            return;
        }
        const q = await getSpotifyQueue();
        if (isMountedRef.current) {
            setQueue(q);
            broadcastState({ queue: q });
        }
    }, [broadcastState]);

    // Consulta activa periódica del reproductor
    const updatePlayback = useCallback(async () => {
        const isConn = isSpotifyConnected();
        setConnected(isConn);
        if (!isConn) {
            setTrack(null);
            setIsPlaying(false);
            broadcastState({ connected: false, track: null, isPlaying: false });
            return;
        }

        const current = await getCurrentPlayback();
        if (!isMountedRef.current) return;

        if (current) {
            setTrack(current);
            setIsPlaying(current.isPlaying);
            if (!isSeeking) {
                setProgressMs(current.progressMs);
            }
            if (current.volumePercent !== undefined) {
                setVolumeState(current.volumePercent);
            }

            // Extraer color del álbum si cambió
            if (current.albumArt && current.albumArt !== globalState.track?.albumArt) {
                extractAlbumAccentColor(current.albumArt).then((col) => {
                    if (isMountedRef.current && col) {
                        setAccentRgb(col);
                        broadcastState({ accentRgb: col });
                    }
                });
            }

            // Extraer BPM y audio features si cambió de pista
            if (current.id && current.id !== globalState.track?.id) {
                getTrackAudioFeatures(current.id, { name: current.name, artist: current.artist }).then((feat) => {
                    if (isMountedRef.current && feat) {
                        setBpm(feat.tempo);
                        setEnergy(feat.energy);
                        broadcastState({ bpm: feat.tempo, energy: feat.energy });
                    }
                });
                // Recargar cola al cambiar de canción
                loadQueue();
            }

            broadcastState({
                connected: true,
                track: current,
                isPlaying: current.isPlaying,
                progressMs: current.progressMs,
            });
        } else {
            setIsPlaying(false);
            broadcastState({ isPlaying: false });
        }
    }, [isSeeking, broadcastState, loadQueue]);

    // Sincronización entre instancias del hook
    useEffect(() => {
        isMountedRef.current = true;

        const handleSync = (e: any) => {
            const data = e?.detail;
            if (!data) return;
            if (data.connected !== undefined) setConnected(data.connected);
            if (data.track !== undefined) setTrack(data.track);
            if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
            if (data.bpm !== undefined) setBpm(data.bpm);
            if (data.energy !== undefined) setEnergy(data.energy);
            if (data.accentRgb !== undefined) setAccentRgb(data.accentRgb);
            if (data.progressMs !== undefined && !isSeeking) setProgressMs(data.progressMs);
            if (data.queue !== undefined) setQueue(data.queue);
        };

        window.addEventListener(SYNC_EVENT, handleSync);
        return () => {
            isMountedRef.current = false;
            window.removeEventListener(SYNC_EVENT, handleSync);
        };
    }, [isSeeking]);

    // Hidratación inmediata desde memoria local para que la UI nunca aparezca vacía en iOS
    useEffect(() => {
        if (!track) {
            const cached = getLastKnownTrack();
            if (cached) {
                setTrack(cached);
                broadcastState({ track: cached });
            }
        }
    }, [track, broadcastState]);

    // Polling activo cada 2.5s y reactivación escalonada instantánea al volver de la app de Spotify en iOS
    useEffect(() => {
        updatePlayback();
        loadQueue();

        pollIntervalRef.current = setInterval(() => {
            updatePlayback();
        }, 2500);

        const handleWakeup = () => {
            if (typeof document !== "undefined" && document.visibilityState === "visible") {
                // Reiniciar el polling timer por si WebKit de iOS congeló el setInterval al salir
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = setInterval(() => {
                    updatePlayback();
                }, 2500);

                // Ejecución escalonada para compensar la reconexión de sockets de iOS y los servidores de Spotify:
                // Intento 1 (350ms): tiempo para que Safari reabra la conexión de red
                setTimeout(() => {
                    updatePlayback();
                    loadQueue();
                }, 350);

                // Intento 2 (1200ms): tiempo para que Spotify Connect reciba el inicio de canción
                setTimeout(() => {
                    updatePlayback();
                }, 1200);

                // Intento 3 (2600ms): confirmación de reproducción
                setTimeout(() => {
                    updatePlayback();
                }, 2600);
            }
        };

        if (typeof document !== "undefined") {
            document.addEventListener("visibilitychange", handleWakeup);
        }
        if (typeof window !== "undefined") {
            window.addEventListener("pageshow", handleWakeup);
            window.addEventListener("focus", handleWakeup);
        }

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (typeof document !== "undefined") {
                document.removeEventListener("visibilitychange", handleWakeup);
            }
            if (typeof window !== "undefined") {
                window.removeEventListener("pageshow", handleWakeup);
                window.removeEventListener("focus", handleWakeup);
            }
        };
    }, [updatePlayback, loadQueue]);

    // Ticker suave de segundos
    useEffect(() => {
        if (isPlaying && track && !isSeeking) {
            tickerIntervalRef.current = setInterval(() => {
                setProgressMs((prev) => {
                    if (track.durationMs && prev >= track.durationMs) return prev;
                    const next = prev + 1000;
                    globalState.progressMs = next;
                    return next;
                });
            }, 1000);
        } else {
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
        }

        return () => {
            if (tickerIntervalRef.current) clearInterval(tickerIntervalRef.current);
        };
    }, [isPlaying, track, isSeeking]);

    // Controles de reproducción
    const togglePlay = async () => {
        const next = !isPlaying;
        setIsPlaying(next);
        broadcastState({ isPlaying: next });
        if (next) {
            const played = await spotifyPlay(track?.deviceId, track?.uri);
            if (!played) {
                // Fallback directo para iOS si no hay sesión Web API activa
                openSpotifyDeepLink(track?.uri || "spotify:");
            }
        } else {
            await spotifyPause(track?.deviceId);
        }
        setTimeout(updatePlayback, 500);
    };

    const nextTrack = async () => {
        await spotifyNext(track?.deviceId);
        setTimeout(() => {
            updatePlayback();
            loadQueue();
        }, 500);
    };

    const prevTrack = async () => {
        await spotifyPrevious(track?.deviceId);
        setTimeout(() => {
            updatePlayback();
            loadQueue();
        }, 500);
    };

    const seekTo = async (posMs: number) => {
        setIsSeeking(false);
        setProgressMs(posMs);
        await spotifySeek(posMs, track?.deviceId);
    };

    const playQueueItem = async (uri: string) => {
        await spotifyPlayTrack(uri, track?.deviceId);
        setTimeout(() => {
            updatePlayback();
            loadQueue();
        }, 600);
    };

    const setVolume = async (val: number) => {
        setVolumeState(val);
        setIsMuted(val === 0);
        await spotifySetVolume(val, track?.deviceId);
    };

    const toggleMute = async () => {
        if (isMuted) {
            const restored = prevVolumeRef.current || 50;
            setVolumeState(restored);
            setIsMuted(false);
            await spotifySetVolume(restored, track?.deviceId);
        } else {
            prevVolumeRef.current = volume;
            setVolumeState(0);
            setIsMuted(true);
            await spotifySetVolume(0, track?.deviceId);
        }
    };

    const toggleShuffle = async () => {
        if (!track) return;
        const nextShuffle = !track.shuffleState;
        setTrack({ ...track, shuffleState: nextShuffle });
        await spotifySetShuffle(nextShuffle, track?.deviceId);
    };

    const toggleRepeat = async () => {
        if (!track) return;
        const cur = track.repeatState || "off";
        const nextRepeat = cur === "off" ? "context" : cur === "context" ? "track" : "off";
        setTrack({ ...track, repeatState: nextRepeat });
        await spotifySetRepeat(nextRepeat, track?.deviceId);
    };

    return {
        connected,
        track,
        isPlaying,
        bpm,
        energy,
        accentRgb,
        progressMs,
        queue,
        isSeeking,
        volume,
        isMuted,
        setIsSeeking,
        setProgressMs,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
        playQueueItem,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        loadQueue,
        refreshPlayback: updatePlayback
    };
}
