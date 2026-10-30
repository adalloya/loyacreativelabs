"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StudioSong,
  LyricLine,
  fetchSongMetadataAndLyrics,
  parsePlainLyrics,
  exportToLRC,
  loadStudioLibrary,
  saveStudioLibrary,
} from "@/lib/musicUtils";
import {
  Upload,
  Search,
  FileText,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Disc,
  Volume2,
  Gauge,
  Download,
  Music2,
  Tv,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function SongStudioView() {
  // Estado de la librería y canción activa
  const [library, setLibrary] = useState<StudioSong[]>([]);
  const [activeSongId, setActiveSongId] = useState<string>("");
  const [activeTabMode, setActiveTabMode] = useState<"edit" | "tap-sync" | "prompter">("prompter");

  // Campos de edición de la canción activa
  const [title, setTitle] = useState<string>("");
  const [artist, setArtist] = useState<string>("");
  const [album, setAlbum] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [rawLyricsInput, setRawLyricsInput] = useState<string>("");

  // Estado del reproductor y reloj a 60 FPS
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [tapCursor, setTapCursor] = useState<number>(0);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);

  // 1. Cargar la librería inicial desde localStorage
  useEffect(() => {
    const loaded = loadStudioLibrary();
    setLibrary(loaded);
    if (loaded.length > 0) {
      loadSongIntoStudio(loaded[0]);
    }
  }, []);

  // Cargar una canción seleccionada al estudio
  const loadSongIntoStudio = (song: StudioSong) => {
    setActiveSongId(song.id);
    setTitle(song.title);
    setArtist(song.artist);
    setAlbum(song.album || "");
    setCoverUrl(song.coverUrl || "");
    setAudioUrl(song.audioUrl || "");
    setLyrics(song.lyrics);
    setRawLyricsInput(song.lyrics.map((l) => l.text).join("\n"));
    setTapCursor(0);
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
  };

  // Guardar cambios de la canción activa en la librería
  const saveCurrentSongToLibrary = useCallback(
    (updatedLyrics?: LyricLine[], customProps?: Partial<StudioSong>) => {
      if (!activeSongId) return;

      setLibrary((prevLibrary) => {
        const next = prevLibrary.map((item) => {
          if (item.id === activeSongId) {
            const currentLyrics = updatedLyrics || lyrics;
            const isSynced = currentLyrics.some((l) => l.time !== null);
            return {
              ...item,
              title: customProps?.title ?? title,
              artist: customProps?.artist ?? artist,
              album: customProps?.album ?? album,
              coverUrl: customProps?.coverUrl ?? coverUrl,
              audioUrl: customProps?.audioUrl ?? audioUrl,
              lyrics: currentLyrics,
              isSynced,
              ...customProps,
            };
          }
          return item;
        });
        saveStudioLibrary(next);
        return next;
      });
    },
    [activeSongId, title, artist, album, coverUrl, audioUrl, lyrics]
  );

  // Mostrar notificación efímera
  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3200);
  };

  // 2. Subir archivo MP3 local
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    let guessedArtist = "";
    let guessedTitle = cleanName;

    if (cleanName.includes("-")) {
      const parts = cleanName.split("-");
      guessedArtist = parts[0].trim();
      guessedTitle = parts.slice(1).join("-").trim();
    }

    const newSong: StudioSong = {
      id: `song-${Date.now()}`,
      title: guessedTitle,
      artist: guessedArtist,
      album: "",
      coverUrl: "",
      audioUrl: url,
      audioFileName: file.name,
      lyrics: [],
      isSynced: false,
      createdAt: Date.now(),
    };

    setLibrary((prev) => {
      const updated = [newSong, ...prev];
      saveStudioLibrary(updated);
      return updated;
    });

    loadSongIntoStudio(newSong);
    showNotice(`Archivo "${file.name}" cargado al estudio`);

    // Intentar autocompletar automáticamente si tenemos título
    if (guessedTitle) {
      triggerAutoFetch(guessedTitle, guessedArtist, newSong.id, url);
    }
  };

  // 3. Autocompletar con iTunes Search API + LRCLIB
  const triggerAutoFetch = async (
    qTitle: string,
    qArtist: string,
    targetSongId = activeSongId,
    targetAudioUrl = audioUrl
  ) => {
    if (!qTitle) return;
    setIsLoadingMetadata(true);

    try {
      const data = await fetchSongMetadataAndLyrics(qTitle, qArtist);
      setTitle(data.title);
      setArtist(data.artist);
      if (data.album) setAlbum(data.album);
      if (data.coverUrl) setCoverUrl(data.coverUrl);

      if (data.lyrics.length > 0) {
        setLyrics(data.lyrics);
        setRawLyricsInput(data.lyrics.map((l) => l.text).join("\n"));
        showNotice(
          data.isAlreadySynced
            ? "Letra sincronizada encontrada en LRCLIB"
            : "Letra encontrada (lista para Tap-to-Sync)"
        );
      } else {
        showNotice("Metadatos encontrados (sin letra automática en la base de datos)");
      }

      // Actualizar en la librería persistente
      setLibrary((prev) => {
        const next = prev.map((s) => {
          if (s.id === targetSongId) {
            return {
              ...s,
              title: data.title,
              artist: data.artist,
              album: data.album || s.album,
              coverUrl: data.coverUrl || s.coverUrl,
              audioUrl: targetAudioUrl || s.audioUrl,
              lyrics: data.lyrics.length > 0 ? data.lyrics : s.lyrics,
              isSynced: data.isAlreadySynced,
              duration: data.duration || s.duration,
            };
          }
          return s;
        });
        saveStudioLibrary(next);
        return next;
      });
    } catch (err) {
      console.error("Error al buscar metadatos:", err);
      showNotice("No fue posible consultar los metadatos en línea");
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // 4. Sincronización del reloj de audio a 60 FPS
  useEffect(() => {
    let rafId: number;
    const syncClock = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafId = requestAnimationFrame(syncClock);
    };
    rafId = requestAnimationFrame(syncClock);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 5. Lógica de Barra Espaciadora para Modo Tap-to-Sync
  const stampCurrentLine = useCallback(() => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    const stampedTime = Number(audioRef.current.currentTime.toFixed(2));
    setLyrics((prev) => {
      const nextLyrics = prev.map((line, idx) =>
        idx === tapCursor ? { ...line, time: stampedTime } : line
      );
      saveCurrentSongToLibrary(nextLyrics);
      return nextLyrics;
    });

    const nextCursor = Math.min(lyrics.length - 1, tapCursor + 1);
    setTapCursor(nextCursor);
    lineRefs.current[nextCursor]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [tapCursor, lyrics.length, saveCurrentSongToLibrary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (activeTabMode === "tap-sync") {
          stampCurrentLine();
        } else if (audioRef.current) {
          if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
          } else {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabMode, stampCurrentLine]);

  // Manejar cambio de velocidad
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Manejar salto en la barra de tiempo
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  // Calcular índice activo en modo Prompter
  const activePrompterIndex = lyrics.reduce((acc, line, idx) => {
    return line.time !== null && currentTime >= line.time ? idx : acc;
  }, 0);

  // Auto-scroll del Prompter hacia la línea activa
  useEffect(() => {
    if (activeTabMode === "prompter" && prompterContainerRef.current) {
      const activeEl = lineRefs.current[activePrompterIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activePrompterIndex, activeTabMode]);

  // Descargar archivo .LRC
  const handleDownloadLRC = () => {
    if (lyrics.length === 0) return;
    const lrcContent = exportToLRC(lyrics, title, artist);
    const blob = new Blob([lrcContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${artist || "Artista"} - ${title || "Canción"}.lrc`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("Archivo .LRC exportado correctamente");
  };

  // Eliminar canción de la librería
  const handleDeleteSong = (songId: string) => {
    if (!confirm("¿Deseas eliminar esta canción de tu librería?")) return;
    setLibrary((prev) => {
      const filtered = prev.filter((s) => s.id !== songId);
      saveStudioLibrary(filtered);
      if (activeSongId === songId && filtered.length > 0) {
        loadSongIntoStudio(filtered[0]);
      }
      return filtered;
    });
    showNotice("Canción eliminada de la librería");
  };

  // Formato mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Elemento de audio nativo */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d)) setDuration(d);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Banner de Notificación */}
      {notification && (
        <div className="p-3 px-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-white flex items-center justify-between animate-in fade-in">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-400 hover:text-white cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* CABECERA PRINCIPAL: DATOS DE LA CANCIÓN Y REPRODUCTOR INTEGRADO */}
      <div className="apple-glass rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Carátula HD */}
          <div className="lg:col-span-3 flex items-center gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-black/60 border border-white/15 overflow-hidden flex items-center justify-center shrink-0 shadow-lg relative">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-500 gap-1 p-2 text-center">
                  <Music2 className="w-6 h-6 opacity-40" />
                  <span className="text-[10px]">Sin carátula</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A84FF] block mb-0.5">
                {album || "Pista MP3"}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {title || "Sin título cargado"}
              </h2>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {artist || "Artista desconocido"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    lyrics.some((l) => l.time !== null)
                      ? "bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30"
                      : "bg-white/5 text-zinc-400 border-white/10"
                  }`}
                >
                  {lyrics.some((l) => l.time !== null) ? "Sincronizada" : "Letra plana"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {lyrics.length} líneas
                </span>
              </div>
            </div>
          </div>

          {/* Formulario de Metadatos y Buscador */}
          <div className="lg:col-span-9 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir MP3</span>
                <input
                  type="file"
                  accept="audio/mp3,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => saveCurrentSongToLibrary(undefined, { title })}
                placeholder="Título de la canción..."
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1 min-w-[130px] focus:outline-none focus:border-[#0A84FF]"
              />

              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                onBlur={() => saveCurrentSongToLibrary(undefined, { artist })}
                placeholder="Artista..."
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white flex-1 min-w-[120px] focus:outline-none focus:border-[#0A84FF]"
              />

              <button
                onClick={() => triggerAutoFetch(title, artist)}
                disabled={!title || isLoadingMetadata}
                className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isLoadingMetadata ? "Buscando..." : "Buscar Letra & Info"}</span>
              </button>

              <button
                onClick={handleDownloadLRC}
                disabled={lyrics.length === 0}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white transition disabled:opacity-30 cursor-pointer border border-white/10"
                title="Descargar archivo .LRC"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Controles de Reproducción y Barra de Tiempo */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (!audioRef.current) return;
                    if (isPlaying) {
                      audioRef.current.pause();
                    } else {
                      audioRef.current.play();
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition cursor-pointer shadow-sm shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 accent-[#0A84FF] h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-mono text-zinc-400 w-10">
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Control de Velocidad de Práctica */}
                <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-[10px] font-semibold">
                  <Gauge className="w-3 h-3 text-zinc-400 ml-1" />
                  {[0.8, 1.0, 1.1].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-1.5 py-0.5 rounded-lg transition cursor-pointer ${
                        playbackRate === rate
                          ? "bg-white text-black font-bold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Modos del Estudio */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTabMode("prompter")}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === "prompter"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Teleprompter en Vivo</span>
            </button>

            <button
              onClick={() => setActiveTabMode("tap-sync")}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === "tap-sync"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Modo Tap-to-Sync</span>
            </button>

            <button
              onClick={() => setActiveTabMode("edit")}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTabMode === "edit"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Editar Letra</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {activeTabMode === "tap-sync" && (
              <span className="hidden sm:inline">
                Toca <strong>Espacio</strong> para marcar el tiempo de la línea activa
              </span>
            )}
            {activeTabMode === "prompter" && (
              <span className="hidden sm:inline">
                Haz clic en cualquier verso para saltar a ese momento del audio
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE TRABAJO PRINCIPAL: SELECTOR DE CANCIÓN Y MODO ACTIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Librería de Canciones */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="apple-glass rounded-3xl p-5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-sm font-bold text-white">Mi Librería de Estudio</h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {library.length} pistas
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {library.map((song) => {
                const isSelected = song.id === activeSongId;
                return (
                  <div
                    key={song.id}
                    onClick={() => loadSongIntoStudio(song)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#0A84FF]/20 border-[#0A84FF]/50 text-white shadow-[0_0_15px_rgba(10,132,255,0.2)]"
                        : "bg-black/40 border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-4 h-4 opacity-40 text-zinc-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate text-white">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {song.artist || "Artista"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          song.isSynced ? "bg-[#30D158]" : "bg-zinc-600"
                        }`}
                        title={song.isSynced ? "Sincronizada" : "Sin sincronizar"}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSong(song.id);
                        }}
                        className="p-1 rounded-lg text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Eliminar de la librería"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Vista del Modo Seleccionado */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* MODO 1: EDITAR LETRA */}
          {activeTabMode === "edit" && (
            <div className="apple-glass rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Editor de Letra</h3>
                  <p className="text-xs text-zinc-400">
                    Pega o ajusta la letra (cada renglón representará un verso al sincronizar)
                  </p>
                </div>
                <button
                  onClick={() => {
                    const parsed = parsePlainLyrics(rawLyricsInput);
                    setLyrics(parsed);
                    saveCurrentSongToLibrary(parsed);
                    showNotice("Letra actualizada y guardada");
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition cursor-pointer"
                >
                  Guardar Letra
                </button>
              </div>

              <textarea
                value={rawLyricsInput}
                onChange={(e) => {
                  setRawLyricsInput(e.target.value);
                  const parsed = parsePlainLyrics(e.target.value);
                  setLyrics(parsed);
                  saveCurrentSongToLibrary(parsed);
                }}
                rows={14}
                placeholder="Escribe o pega aquí la letra de tu canción..."
                className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#0A84FF] leading-relaxed"
              />
            </div>
          )}

          {/* MODO 2: TAP-TO-SYNC */}
          {activeTabMode === "tap-sync" && (
            <div className="apple-glass rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">Modo Tap-to-Sync</h3>
                  <p className="text-xs text-zinc-400">
                    Pulsa la barra espaciadora o el botón verde justo cuando comience el verso iluminado
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLyrics((prev) => {
                        const reset = prev.map((l) => ({ ...l, time: null }));
                        saveCurrentSongToLibrary(reset);
                        return reset;
                      });
                      setTapCursor(0);
                      showNotice("Tiempos reiniciados");
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white transition text-xs flex items-center gap-1 cursor-pointer"
                    title="Reiniciar marcas de tiempo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reiniciar Tiempos</span>
                  </button>

                  <button
                    onClick={stampCurrentLine}
                    className="px-5 py-2.5 rounded-xl bg-[#30D158] hover:bg-[#28b84d] text-black font-extrabold text-xs transition cursor-pointer shadow-[0_0_20px_rgba(48,209,88,0.35)] active:scale-95 flex items-center gap-1.5"
                  >
                    <Timer className="w-4 h-4" />
                    <span>Marcar Verso (Espacio)</span>
                  </button>
                </div>
              </div>

              {lyrics.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-xs">
                  Aún no hay letra cargada. Ve a &quot;Editar Letra&quot; o busca los datos en línea.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 py-4">
                  {lyrics.map((line, idx) => {
                    const isTarget = idx === tapCursor;
                    return (
                      <div
                        key={line.id}
                        ref={(el) => {
                          lineRefs.current[idx] = el;
                        }}
                        onClick={() => setTapCursor(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isTarget
                            ? "bg-[#30D158] text-black font-bold scale-[1.01] shadow-[0_0_25px_rgba(48,209,88,0.35)] border-[#30D158]"
                            : line.time !== null
                            ? "bg-black/50 border-white/15 text-zinc-200"
                            : "bg-black/30 border-white/5 text-zinc-500"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 text-[10px] font-mono shrink-0 ${
                              isTarget ? "text-black/70" : "text-zinc-500"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span className="text-sm truncate">{line.text}</span>
                        </div>

                        <span
                          className={`text-xs font-mono px-2.5 py-1 rounded-lg shrink-0 ${
                            isTarget
                              ? "bg-black/20 text-black font-extrabold"
                              : line.time !== null
                              ? "bg-white/10 text-[#30D158] font-bold"
                              : "bg-white/5 text-zinc-600"
                          }`}
                        >
                          {line.time !== null ? `${line.time.toFixed(2)}s` : "Sin marcar"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODO 3: TELEPROMPTER EN VIVO */}
          {activeTabMode === "prompter" && (
            <div className="apple-glass rounded-3xl p-6 border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Teleprompter en Vivo</h3>
                  <p className="text-xs text-zinc-400">
                    Sincronización a 60 FPS con el audio real. Haz clic en una frase para saltar a ella.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#0A84FF]">
                  {formatTime(currentTime)}
                </div>
              </div>

              {lyrics.length === 0 ? (
                <div className="p-16 text-center text-zinc-500 text-xs">
                  No hay letra disponible para el prompter. Carga un MP3 o busca los metadatos.
                </div>
              ) : (
                <div
                  ref={prompterContainerRef}
                  className="space-y-6 max-h-[500px] overflow-y-auto px-4 py-24 rounded-2xl bg-black/60 border border-white/10 text-center select-none"
                >
                  {lyrics.map((line, idx) => {
                    const isActive = idx === activePrompterIndex;
                    return (
                      <div
                        key={line.id}
                        ref={(el) => {
                          lineRefs.current[idx] = el;
                        }}
                        onClick={() => {
                          if (audioRef.current && line.time !== null) {
                            audioRef.current.currentTime = line.time;
                            setCurrentTime(line.time);
                          }
                        }}
                        className={`py-3 px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "text-white font-extrabold text-2xl sm:text-3xl bg-white/[0.08] border border-[#0A84FF]/40 shadow-[0_0_30px_rgba(10,132,255,0.25)] scale-105"
                            : "text-zinc-500 font-medium text-lg sm:text-xl opacity-40 hover:opacity-75"
                        }`}
                      >
                        <span>{line.text}</span>
                        {line.time !== null && (
                          <span className="block text-[10px] font-mono text-zinc-500 mt-1 opacity-70">
                            {formatTime(line.time)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
