// src/components/studio/HorizontalTeleprompterRibbon.tsx
"use client";

import React, { useRef, useEffect, useState } from "react";
import { StudioSong, LyricLine, fetchSongMetadataAndLyrics } from "@/lib/musicUtils";
import {
  Play,
  Pause,
  Maximize2,
  Search,
  Music,
  Check,
  Timer,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface HorizontalTeleprompterRibbonProps {
  activeSong: StudioSong | null;
  isPlaying: boolean;
  songTime: number;
  songDuration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onOpenFullscreen: () => void;
  onLoadSongLyrics?: (lyrics: LyricLine[], title?: string, artist?: string) => void;
}

export const HorizontalTeleprompterRibbon: React.FC<HorizontalTeleprompterRibbonProps> = ({
  activeSong,
  isPlaying,
  songTime,
  songDuration,
  onTogglePlay,
  onSeek,
  onOpenFullscreen,
  onLoadSongLyrics,
}) => {
  const ribbonScrollRef = useRef<HTMLDivElement | null>(null);
  const [showSearchPopover, setShowSearchPopover] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<StudioSong | null>(null);

  const lyrics = Array.isArray(activeSong?.lyrics) ? activeSong.lyrics : [];

  // Calcular índice activo de la frase
  const activeIndex = lyrics.findIndex((line, i) => {
    if (!line || typeof line.time !== "number") return false;
    const nextLine = lyrics[i + 1];
    if (nextLine && typeof nextLine.time === "number") {
      return songTime >= line.time && songTime < nextLine.time;
    }
    return songTime >= line.time;
  });

  // Auto-scroll horizontal suave centrado en la tarjeta activa
  useEffect(() => {
    if (activeIndex >= 0 && ribbonScrollRef.current) {
      try {
        const activeCard = ribbonScrollRef.current.children[activeIndex] as HTMLElement | undefined;
        if (activeCard && typeof activeCard.scrollIntoView === "function") {
          activeCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      } catch {
        // Safe scroll error catch
      }
    }
  }, [activeIndex]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatTimeMs = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00.0";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
  };

  const handleSearchLyrics = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const parts = searchQuery.split("-");
      const titleQuery = parts[0]?.trim() || searchQuery;
      const artistQuery = parts[1]?.trim() || "";
      const result = await fetchSongMetadataAndLyrics(titleQuery, artistQuery);
      if (result) {
        setSearchResult({
          id: `lrclib-${Date.now()}`,
          title: result.title,
          artist: result.artist,
          album: result.album,
          coverUrl: result.coverUrl,
          duration: result.duration,
          audioUrl: activeSong?.audioUrl || "",
          lyrics: result.lyrics,
          isSynced: true,
          createdAt: Date.now(),
        });
      }
    } catch (err) {
      console.warn("[TeleprompterRibbon] Error búsqueda LRCLIB:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplySearchResult = () => {
    if (!searchResult || !onLoadSongLyrics) return;
    onLoadSongLyrics(searchResult.lyrics, searchResult.title, searchResult.artist);
    setSearchResult(null);
    setShowSearchPopover(false);
  };

  return (
    <div className="w-full bg-[#0D1017]/95 backdrop-blur-md border-b border-white/10 shrink-0 z-20 select-none flex flex-col transition-all">
      {/* 1. BARRA PRINCIPAL DEL TELEPROMPTER RIBBON */}
      <div className="h-14 sm:h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        {/* LADO IZQUIERDO: Transporte & Meta de Canción */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 max-w-[140px] sm:max-w-[240px] md:max-w-[280px]">
          {/* Botón Play/Pause Compacto */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={!activeSong?.audioUrl}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition shadow-lg ${
              isPlaying
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20"
                : "bg-white/10 text-white hover:bg-white/15"
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title={
              !activeSong?.audioUrl
                ? "Sin audio cargado en la pista"
                : isPlaying
                ? "Pausar pista"
                : "Reproducir pista"
            }
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>

          {/* Información de Canción & Tiempo */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-bold text-white truncate">
                {activeSong?.title || "Sin Canción"}
              </span>
              {activeSong?.isSynced && (
                <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Sync
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
              <span className="text-blue-400 font-bold">{formatTime(songTime || 0)}</span>
              <span>/</span>
              <span>{formatTime(songDuration || 0)}</span>
            </div>
          </div>
        </div>

        {/* ZONA CENTRAL: CINTA HORIZONTAL DE VERSOS (SIEMPRE VISIBLE) */}
        <div className="flex-1 min-w-0 overflow-hidden relative flex items-center">
          {lyrics.length === 0 ? (
            /* Estado vacío si no hay letra */
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3 py-1 px-2 text-zinc-400 text-xs">
              <Music size={14} className="text-zinc-500 shrink-0" />
              <span className="text-[11px] sm:text-xs truncate">
                {activeSong ? "Pista sin letra sincronizada" : "Carga una canción para ver el teleprompter"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery(activeSong ? `${activeSong.title} ${activeSong.artist}` : "");
                  setShowSearchPopover(!showSearchPopover);
                }}
                className="px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-[10px] sm:text-xs font-mono font-semibold flex items-center gap-1 transition shrink-0"
              >
                <Search size={11} />
                <span>Buscar Letra</span>
              </button>
            </div>
          ) : (
            /* Cinta de Frases con Acordes y Tiempos */
            <div
              ref={ribbonScrollRef}
              className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 px-2 no-scrollbar snap-x w-full"
            >
              {lyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = activeIndex > idx;
                const timeBadge = line && typeof line.time === "number" ? formatTime(line.time) : "--:--";

                return (
                  <div
                    key={`${line?.id || "tape"}-${idx}`}
                    onClick={() => {
                      if (line && typeof line.time === "number") onSeek(line.time);
                    }}
                    className={`snap-center shrink-0 cursor-pointer rounded-xl px-3 py-1.5 transition-all duration-200 flex flex-col items-center justify-center border text-center ${
                      isActive
                        ? "bg-gradient-to-r from-blue-900/60 to-purple-900/50 border-blue-400 text-white shadow-[0_0_18px_rgba(59,130,246,0.4)] scale-105 z-10"
                        : isPast
                        ? "bg-black/30 border-white/5 text-zinc-500 opacity-60 hover:opacity-90"
                        : "bg-black/40 border-white/10 text-zinc-300 opacity-80 hover:opacity-100"
                    }`}
                  >
                    {/* Fila Superior: Tiempo y Acorde Flotante */}
                    <div className="flex items-center gap-1.5 text-[9px] font-mono leading-none mb-0.5">
                      <span className={isActive ? "text-blue-300 font-bold" : "text-zinc-500"}>
                        {timeBadge}
                      </span>
                      {line?.chord && (
                        <span className="text-amber-400 font-extrabold bg-amber-400/15 px-1 py-0.2 rounded border border-amber-400/30">
                          {line.chord}
                        </span>
                      )}
                    </div>

                    {/* Texto de la Frase */}
                    <p
                      className={`font-sans tracking-tight leading-snug whitespace-nowrap max-w-[180px] sm:max-w-[260px] md:max-w-[340px] truncate ${
                        isActive
                          ? "text-xs sm:text-sm font-extrabold text-white"
                          : "text-[11px] sm:text-xs font-medium text-zinc-400"
                      }`}
                    >
                      {line?.text || ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LADO DERECHO: Herramientas & BOTÓN PANTALLA COMPLETA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botón Buscar Letra LRCLIB */}
          <button
            type="button"
            onClick={() => {
              setSearchQuery(activeSong ? `${activeSong.title} ${activeSong.artist}` : "");
              setShowSearchPopover(!showSearchPopover);
            }}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition ${
              showSearchPopover
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/10"
            }`}
            title="Buscar letra en catálogo LRCLIB"
          >
            <Search size={13} />
            <span className="hidden md:inline">Buscar Letra</span>
          </button>

          {/* BOTÓN PANTALLA COMPLETA (Petición clave del usuario) */}
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition active:scale-95"
            title="Abrir Teleprompter en Pantalla Completa"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
        </div>
      </div>

      {/* 2. POPOVER DESPLEGABLE: BUSCADOR DE LETRAS LRCLIB */}
      {showSearchPopover && (
        <div className="p-3 sm:p-4 bg-[#141622] border-t border-white/10 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchLyrics} className="flex gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Título y artista (ej. Lamento Boliviano - Enanitos Verdes)..."
                className="w-full bg-[#090A0F] border border-white/15 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition"
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </form>

          {searchResult && (
            <div className="max-w-xl mx-auto mt-2 p-2.5 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {searchResult.title} — {searchResult.artist}
                </p>
                <p className="text-[10px] font-mono text-emerald-400">
                  ✓ {searchResult.lyrics.length} líneas sincronizadas encontradas
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplySearchResult}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1 transition shrink-0"
              >
                <Check size={12} />
                <span>Aplicar a Pista</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HorizontalTeleprompterRibbon;
