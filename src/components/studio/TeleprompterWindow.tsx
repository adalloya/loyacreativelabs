// src/components/studio/TeleprompterWindow.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { StudioSong, LyricLine, fetchSongMetadataAndLyrics } from "@/lib/musicUtils";
import {
  Tv,
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Search,
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  AlignLeft,
  Columns,
  Music2,
  Check,
  Timer,
  Volume2,
} from "lucide-react";

interface TeleprompterWindowProps {
  isOpen: boolean;
  onClose: () => void;
  activeSong: StudioSong | null;
  isPlaying: boolean;
  songTime: number;
  songDuration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onLoadSongLyrics?: (lyrics: LyricLine[], title?: string, artist?: string) => void;
}

const TeleprompterInner: React.FC<TeleprompterWindowProps> = ({
  isOpen,
  onClose,
  activeSong,
  isPlaying,
  songTime,
  songDuration,
  onTogglePlay,
  onSeek,
  onLoadSongLyrics,
}) => {
  const [viewMode, setViewMode] = useState<"horizontal" | "list" | "sync">("horizontal");
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(2); // 1 = normal, 2 = grande, 3 = gigante
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Modo Sincronización Tap-to-Sync
  const [syncCursor, setSyncCursor] = useState<number>(0);
  const [draftLyrics, setDraftLyrics] = useState<LyricLine[]>([]);
  const syncLineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sincronizar draftLyrics cuando cambia la canción activa
  useEffect(() => {
    if (Array.isArray(activeSong?.lyrics)) {
      setDraftLyrics(activeSong.lyrics);
      const firstUnsynced = activeSong.lyrics.findIndex((l) => l && (l.time === null || typeof l.time !== "number"));
      setSyncCursor(firstUnsynced >= 0 ? firstUnsynced : 0);
    } else {
      setDraftLyrics([]);
      setSyncCursor(0);
    }
  }, [activeSong]);

  // Manejador para estampar verso en modo Sync
  const handleStampSyncLine = () => {
    if (draftLyrics.length === 0) return;
    const stampedTime = Number((songTime || 0).toFixed(2));
    const updated = draftLyrics.map((line, idx) =>
      idx === syncCursor ? { ...line, time: stampedTime } : line
    );
    setDraftLyrics(updated);
    if (onLoadSongLyrics) {
      onLoadSongLyrics(updated, activeSong?.title, activeSong?.artist);
    }
    const nextIdx = Math.min(draftLyrics.length - 1, syncCursor + 1);
    setSyncCursor(nextIdx);
    try {
      const targetEl = syncLineRefs.current[nextIdx];
      if (targetEl && typeof targetEl.scrollIntoView === "function") {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } catch {
      // scroll fallback
    }
  };

  // Escuchar barra espaciadora cuando se está en modo sync
  useEffect(() => {
    if (!isOpen || viewMode !== "sync") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!isPlaying) onTogglePlay();
        handleStampSyncLine();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, viewMode, isPlaying, songTime, syncCursor, draftLyrics]);

  // Buscador de letras LRCLIB integrado
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<StudioSong | null>(null);
  const [showSearchBox, setShowSearchBox] = useState(false);

  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const horizontalTrackRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  const lyrics = Array.isArray(activeSong?.lyrics) ? activeSong.lyrics : [];

  // Calcular índice de la frase activa basada en songTime
  const activeIndex = lyrics.findIndex((line, i) => {
    if (!line || typeof line.time !== "number") return false;
    const nextLine = lyrics[i + 1];
    if (nextLine && typeof nextLine.time === "number") {
      return songTime >= line.time && songTime < nextLine.time;
    }
    return songTime >= line.time;
  });

  // Auto-scroll centrado en la vista de lista vertical
  useEffect(() => {
    if (viewMode === "list" && activeIndex >= 0) {
      try {
        const el = lineRefs.current[activeIndex];
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } catch {
        // Safe scroll error catch
      }
    }
  }, [activeIndex, viewMode]);

  // Auto-scroll en el carrusel horizontal
  useEffect(() => {
    if (viewMode === "horizontal" && activeIndex >= 0 && horizontalTrackRef.current) {
      try {
        const activeCard = horizontalTrackRef.current.children[activeIndex] as HTMLElement | undefined;
        if (activeCard && typeof activeCard.scrollIntoView === "function") {
          activeCard.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      } catch {
        // Safe scroll error catch
      }
    }
  }, [activeIndex, viewMode]);

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

  // Buscar letras en LRCLIB
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
      console.warn("Error en búsqueda LRCLIB:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApplySearchResult = () => {
    if (!searchResult || !onLoadSongLyrics) return;
    onLoadSongLyrics(searchResult.lyrics, searchResult.title, searchResult.artist);
    setSearchResult(null);
    setShowSearchBox(false);
  };

  // Frase actual y tiempos
  const currentLine = activeIndex >= 0 ? lyrics[activeIndex] : null;
  const nextLine = activeIndex >= 0 && activeIndex + 1 < lyrics.length ? lyrics[activeIndex + 1] : null;
  const prevLine = activeIndex > 0 ? lyrics[activeIndex - 1] : null;

  return (
    <div
      className={`fixed z-50 transition-all select-none ${
        isFullscreen
          ? "inset-0 bg-[#090A0F]"
          : "inset-0 sm:inset-6 lg:inset-14 bg-[#090A0F] sm:bg-[#0B0D14]/95 sm:backdrop-blur-xl sm:border sm:border-white/15 sm:rounded-3xl shadow-2xl overflow-hidden"
      } flex flex-col`}
    >
      {/* 1. BARRA SUPERIOR DE LA VENTANA */}
      <div className="h-14 px-4 sm:px-6 bg-[#11131A] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Tv size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {activeSong ? `${activeSong.title || "Pista de Estudio"} — ${activeSong.artist || "Artista"}` : "Teleprompter en Vivo"}
              </h3>
              {activeSong?.isSynced && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Sincronizado
                </span>
              )}
            </div>
            <p className="text-[10px] font-mono text-zinc-400">
              Tiempo: <span className="text-blue-400 font-bold">{formatTime(songTime || 0)}</span> / {formatTime(songDuration || 0)}
            </p>
          </div>
        </div>

        {/* Herramientas de visualización y control */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Botón Buscar Letras LRCLIB */}
          <button
            type="button"
            onClick={() => setShowSearchBox(!showSearchBox)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition ${
              showSearchBox
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/10"
            }`}
            title="Buscar letra en catálogo LRCLIB"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Buscar Letra</span>
          </button>

          {/* Selector de Modo: Horizontal vs Lista vs Tap-to-Sync */}
          <div className="flex bg-black/40 border border-white/10 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("horizontal")}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                viewMode === "horizontal"
                  ? "bg-blue-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Vista en Cinta Horizontal con Tiempos"
            >
              <Columns size={12} />
              <span className="hidden md:inline">Horizontal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                viewMode === "list"
                  ? "bg-blue-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Vista en Lista Vertical con Tiempos"
            >
              <AlignLeft size={12} />
              <span className="hidden md:inline">Lista</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sync")}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                viewMode === "sync"
                  ? "bg-emerald-600 text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Sincronizar letra línea por línea (Tap-to-Sync)"
            >
              <Timer size={12} />
              <span className="hidden md:inline">Tap-to-Sync</span>
            </button>
          </div>

          {/* Tamaño de fuente */}
          <div className="hidden sm:flex bg-black/40 border border-white/10 p-0.5 rounded-xl text-xs font-mono">
            <button
              type="button"
              onClick={() => setFontSizeLevel(Math.max(1, fontSizeLevel - 1))}
              className="px-2 py-1 text-zinc-400 hover:text-white rounded-lg transition"
              title="Disminuir tamaño de letra"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSizeLevel(Math.min(3, fontSizeLevel + 1))}
              className="px-2 py-1 text-zinc-400 hover:text-white rounded-lg transition"
              title="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-400 hover:text-white transition"
            title={isFullscreen ? "Restaurar ventana" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 text-zinc-400 transition ml-1"
            title="Cerrar teleprompter"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. PANEL DESPLEGABLE: BUSCADOR DE LETRAS LRCLIB */}
      {showSearchBox && (
        <div className="p-4 bg-[#141622] border-b border-white/10 animate-in slide-in-from-top-3 duration-200">
          <form onSubmit={handleSearchLyrics} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por canción y artista (ej. Lamento Boliviano - Enanitos Verdes)..."
                className="w-full bg-[#090A0F] border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition"
            >
              {isSearching ? "Buscando..." : "Buscar Letra"}
            </button>
          </form>

          {searchResult && (
            <div className="max-w-2xl mx-auto mt-3 p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                {searchResult.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={searchResult.coverUrl}
                    alt={searchResult.title}
                    className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{searchResult.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{searchResult.artist}</p>
                  <p className="text-[10px] font-mono text-emerald-400">
                    ✓ {searchResult.lyrics.length} líneas sincronizadas encontradas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplySearchResult}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition shrink-0"
              >
                <Check size={13} />
                <span>Cargar a Teleprompter</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CONTENIDO CENTRAL: MODO HORIZONTAL VS MODO LISTA */}
      <div className="flex-1 overflow-hidden relative flex flex-col justify-center">
        {lyrics.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <Music2 size={36} className="text-zinc-600 mx-auto" />
            <h4 className="text-sm font-bold text-zinc-400">No hay letra cargada para esta pista</h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Utiliza el botón <strong>&quot;Buscar Letra&quot;</strong> arriba para descargar la letra sincronizada desde LRCLIB o importa una canción desde el Drawer.
            </p>
            <button
              type="button"
              onClick={() => setShowSearchBox(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono transition"
            >
              Buscar Letra en LRCLIB
            </button>
          </div>
        ) : viewMode === "horizontal" ? (
          /* ======================================================== */
          /* MODO HORIZONTAL: CINTA DE FRASES CON TIEMPOS EXACTOS      */
          /* ======================================================== */
          <div className="w-full h-full flex flex-col justify-center px-4 sm:px-10 py-6">
            {/* Cinta con Scroll Horizontal y Frase Activa Centrada */}
            <div
              ref={horizontalTrackRef}
              className="flex items-center gap-4 sm:gap-6 overflow-x-auto py-8 px-6 no-scrollbar snap-x"
            >
              {lyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = activeIndex > idx;
                const isFuture = activeIndex < idx;

                const timeBadge = line.time !== null ? formatTimeMs(line.time) : "--:--";

                return (
                  <div
                    key={`${line?.id || "h"}-${idx}`}
                    onClick={() => {
                      if (line.time !== null) onSeek(line.time);
                    }}
                    className={`snap-center shrink-0 cursor-pointer rounded-2xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between border ${
                      isActive
                        ? "min-w-[280px] sm:min-w-[420px] max-w-[550px] bg-gradient-to-b from-blue-950/60 to-purple-950/40 border-blue-500/60 shadow-[0_0_35px_rgba(59,130,246,0.35)] scale-105 z-10"
                        : isPast
                        ? "min-w-[200px] sm:min-w-[260px] bg-black/40 border-white/5 opacity-40 hover:opacity-75 scale-95"
                        : "min-w-[200px] sm:min-w-[260px] bg-black/40 border-white/5 opacity-60 hover:opacity-90 scale-95"
                    }`}
                  >
                    {/* Header de la tarjeta: Tiempo y Acorde */}
                    <div className="flex items-center justify-between gap-2 mb-3 font-mono text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          isActive
                            ? "bg-blue-500 text-white shadow-sm"
                            : "bg-white/10 text-zinc-400"
                        }`}
                      >
                        {timeBadge}
                      </span>
                      {line.chord && (
                        <span className="text-amber-400 font-bold text-xs bg-amber-400/10 px-1.5 py-0.5 rounded">
                          {line.chord}
                        </span>
                      )}
                    </div>

                    {/* Texto de la Frase */}
                    <p
                      className={`font-sans tracking-tight text-center leading-snug ${
                        isActive
                          ? fontSizeLevel === 1
                            ? "text-xl sm:text-2xl font-bold text-white"
                            : fontSizeLevel === 2
                            ? "text-2xl sm:text-3xl font-extrabold text-white drop-shadow"
                            : "text-3xl sm:text-4xl font-black text-white drop-shadow-md"
                          : "text-sm sm:text-base font-medium text-zinc-400"
                      }`}
                    >
                      {line.text}
                    </p>

                    {/* Consejo o estado vocal al pie */}
                    <div className="mt-3 text-center">
                      {isActive && line.vocalCue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30">
                          <Sparkles size={10} /> {line.vocalCue}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-600">
                          Compás {idx + 1}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista previa de la frase siguiente para anticipación vocal */}
            {nextLine && (
              <div className="text-center mt-2 font-mono text-xs text-zinc-500">
                <span>Siguiente: </span>
                <span className="text-zinc-300 font-sans italic">&quot;{nextLine.text}&quot;</span>
                {nextLine.time !== null && (
                  <span className="text-blue-400 ml-1.5">[{formatTime(nextLine.time)}]</span>
                )}
              </div>
            )}
          </div>
        ) : viewMode === "sync" ? (
          /* ======================================================== */
          /* MODO TAP-TO-SYNC: MARCAR TIEMPOS LÍNEA POR LÍNEA         */
          /* ======================================================== */
          <div className="flex-1 overflow-hidden flex flex-col p-4 sm:p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2 flex-wrap">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-emerald-400" /> Modo Tap-to-Sync Integrado
                </h4>
                <p className="text-xs text-zinc-400">
                  Pulsa <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Espacio</kbd> o el botón verde justo al comenzar cada verso.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const reset = draftLyrics.map((l) => ({ ...l, time: null }));
                    setDraftLyrics(reset);
                    setSyncCursor(0);
                    if (onLoadSongLyrics) onLoadSongLyrics(reset, activeSong?.title, activeSong?.artist);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1 transition"
                  title="Reiniciar todos los tiempos"
                >
                  <RotateCcw size={12} />
                  <span>Reiniciar Tiempos</span>
                </button>

                <button
                  type="button"
                  onClick={handleStampSyncLine}
                  className="px-4 py-2 rounded-xl bg-[#30D158] hover:bg-[#28b84d] text-black font-extrabold text-xs font-mono transition shadow-[0_0_20px_rgba(48,209,88,0.35)] active:scale-95 flex items-center gap-1.5"
                >
                  <Timer size={14} />
                  <span>Marcar Verso #{syncCursor + 1}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-2">
              {draftLyrics.map((line, idx) => {
                const isTarget = idx === syncCursor;
                const hasTime = line.time !== null;

                return (
                  <div
                    key={`${line?.id || "h"}-${idx}`}
                    ref={(el) => {
                      syncLineRefs.current[idx] = el;
                    }}
                    onClick={() => setSyncCursor(idx)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isTarget
                        ? "bg-[#30D158]/15 border-[#30D158] shadow-[0_0_20px_rgba(48,209,88,0.25)] scale-[1.01]"
                        : hasTime
                        ? "bg-black/40 border-white/10 hover:border-white/20"
                        : "bg-black/20 border-white/5 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-mono w-6 shrink-0 ${
                          isTarget ? "text-[#30D158] font-bold" : "text-zinc-500"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span
                        className={`text-xs truncate ${
                          isTarget ? "text-white font-bold text-sm" : "text-zinc-200"
                        }`}
                      >
                        {line.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {hasTime && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (line.time !== null) onSeek(line.time);
                            if (!isPlaying) onTogglePlay();
                          }}
                          className="p-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition"
                          title="Escuchar desde aquí"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}

                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded-lg font-bold ${
                          isTarget
                            ? "bg-[#30D158] text-black"
                            : hasTime
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/[0.04] text-zinc-600"
                        }`}
                      >
                        {hasTime ? formatTime(line.time!) : "--:--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* MODO LISTA VERTICAL: TODAS LAS LÍNEAS CON TIMESTAMPS      */
          /* ======================================================== */
          <div
            ref={listContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-12 py-16 space-y-3 text-center no-scrollbar"
          >
            {lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const timeLabel = line.time !== null ? formatTime(line.time) : "--:--";

              return (
                <div
                  key={`${line?.id || "list"}-${idx}`}
                  ref={(el) => {
                    lineRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (line.time !== null) onSeek(line.time);
                  }}
                  className={`py-3 px-4 rounded-2xl transition-all duration-200 cursor-pointer max-w-2xl mx-auto flex items-center justify-between gap-4 border ${
                    isActive
                      ? "bg-white/[0.08] border-blue-500/50 text-white font-bold shadow-[0_0_25px_rgba(59,130,246,0.25)] scale-[1.02]"
                      : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-md shrink-0 ${
                      isActive ? "bg-blue-600 text-white font-bold" : "text-zinc-600 bg-white/5"
                    }`}
                  >
                    {timeLabel}
                  </span>

                  <span
                    className={`flex-1 text-center font-sans ${
                      isActive
                        ? fontSizeLevel === 1
                          ? "text-lg text-white"
                          : fontSizeLevel === 2
                          ? "text-xl text-white font-bold"
                          : "text-2xl text-white font-extrabold"
                        : "text-base"
                    }`}
                  >
                    {line.text}
                  </span>

                  {line.chord ? (
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">
                      {line.chord}
                    </span>
                  ) : (
                    <span className="w-8 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BARRA INFERIOR DE TRANSPORTE Y CONTROL */}
      <div className="h-16 px-4 sm:px-8 bg-[#11131A] border-t border-white/10 flex items-center justify-between gap-3 shrink-0">
        {/* Controles de reproducción */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, songTime - 5))}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
            title="Rebobinar 5 segundos"
          >
            <Rewind size={15} />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition"
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => onSeek(Math.min(songDuration || 100, songTime + 5))}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition"
            title="Adelantar 5 segundos"
          >
            <FastForward size={15} />
          </button>
        </div>

        {/* Barra de progreso de la canción */}
        <div className="flex-1 max-w-xl mx-4 flex items-center gap-3">
          <span className="font-mono text-[11px] text-zinc-400 w-10 text-right">
            {formatTime(songTime || 0)}
          </span>
          <input
            type="range"
            min="0"
            max={songDuration || 100}
            step="0.1"
            value={songTime || 0}
            onChange={(e) => onSeek(parseFloat(e.target.value) || 0)}
            className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
          />
          <span className="font-mono text-[11px] text-zinc-500 w-10">
            {formatTime(songDuration || 0)}
          </span>
        </div>

        {/* Indicador de Línea Activa */}
        <div className="font-mono text-xs text-zinc-400 hidden sm:block">
          Línea <span className="text-white font-bold">{activeIndex + 1}</span> / {lyrics.length}
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage?: string;
}

class TeleprompterErrorBoundary extends React.Component<
  TeleprompterWindowProps,
  ErrorBoundaryState
> {
  constructor(props: TeleprompterWindowProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "Ocurrió una excepción al procesar la letra del teleprompter",
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[TeleprompterErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (!this.props.isOpen) return null;
      return (
        <div className="fixed inset-0 z-50 bg-[#090A0F]/95 backdrop-blur-xl flex items-center justify-center p-6 text-white select-none">
          <div className="bg-[#141622] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-white">Teleprompter Protegido</h3>
            <p className="text-xs text-zinc-400">
              {this.state.errorMessage}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold transition"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={this.props.onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-mono transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return <TeleprompterInner {...this.props} />;
  }
}

export { TeleprompterErrorBoundary as TeleprompterWindow };
export default TeleprompterErrorBoundary;
