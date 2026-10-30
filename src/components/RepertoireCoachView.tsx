"use client";

import React, { useState, useEffect, useRef } from "react";
import { PitchData, midiToNoteName, vocalSynth, chordNameToMidi } from "@/lib/vocalEngine";
import {
  RepertoireSong,
  VocalTechnique,
  LrcLibSearchResult,
  searchLrcLibCatalog,
  parseLrcToLines,
  parseUltraStarTxt,
  parseChordProText,
} from "@/lib/repertoireParsers";
import {
  Wind,
  Sparkles,
  Volume2,
  VolumeX,
  Plus,
  Check,
  Search,
  Play,
  Pause,
  RotateCcw,
  FileCode2,
  Globe,
  ChevronRight,
  Loader2,
  X,
  Music2,
  Upload,
  Mic,
  MicOff,
  Gauge,
  Radio,
} from "lucide-react";

interface RepertoireCoachViewProps {
  currentPitch: PitchData | null;
  isListening?: boolean;
  onToggleMic?: () => void;
}

const PRESET_SONGS: RepertoireSong[] = [
  {
    id: "lamento-boliviano",
    title: "Lamento Boliviano",
    artist: "Enanitos Verdes",
    keySignature: "Em (Mi Menor)",
    bpm: 144,
    durationSec: 48,
    sourceType: "preset",
    lines: [
      {
        id: "lb-1",
        startTimeSec: 0,
        durationSec: 5.5,
        chord: "Em",
        targetMidi: 52, // E3
        text: "Me quieren agitar, me incitan a gritar",
        breatheBefore: true,
        technique: "chest",
        coachNote: "Voz de pecho hablada y relajada. No empujes aire de más en 'gritar'.",
      },
      {
        id: "lb-2",
        startTimeSec: 5.5,
        durationSec: 5.5,
        chord: "Bm7",
        targetMidi: 54, // F#3
        text: "Soy como una roca, palabras no me tocan",
        breatheBefore: true,
        technique: "chest",
        coachNote: "Mantén resonancia en máscara (sonido al frente en la 'o' de roca).",
      },
      {
        id: "lb-3",
        startTimeSec: 11.0,
        durationSec: 5.5,
        chord: "Am7",
        targetMidi: 55, // G3
        text: "Adentro hay un volcán que pronto va a estallar",
        breatheBefore: true,
        technique: "support",
        coachNote: "Activa apoyo abdominal antes de 'volcán' y 'estallar'.",
      },
      {
        id: "lb-4",
        startTimeSec: 16.5,
        durationSec: 5.5,
        chord: "Em → B7",
        targetMidi: 52, // E3
        text: "Yo quiero estar tranquilo...",
        breatheBefore: false,
        technique: "chest",
        coachNote: "Cierra suave con vibrato natural, aprovecha la pausa para inhalar profundo.",
      },
      {
        id: "lb-5",
        startTimeSec: 22.0,
        durationSec: 6.0,
        chord: "Em (Coro)",
        targetMidi: 59, // B3
        text: "Y yo estoy aquí, borracho y loco",
        breatheBefore: true,
        technique: "mixed",
        coachNote: "¡Entrada al coro en Si3 (B3)! Abre espacio vertical interno, usa voz mixta.",
      },
      {
        id: "lb-6",
        startTimeSec: 28.0,
        durationSec: 6.0,
        chord: "Bm7 (Coro)",
        targetMidi: 57, // A3
        text: "Y mi corazón idiota siempre brillará",
        breatheBefore: true,
        technique: "mixed",
        coachNote: "En 'brillará' proyecta hacia los pómulos, evita subir la barbilla.",
      },
      {
        id: "lb-7",
        startTimeSec: 34.0,
        durationSec: 6.0,
        chord: "Am7 → B7",
        targetMidi: 55, // G3
        text: "Y yo te amaré, te amaré por siempre",
        breatheBefore: true,
        technique: "support",
        coachNote: "Dosifica el aire para llegar con reserva al siguiente verso largo.",
      },
      {
        id: "lb-8",
        startTimeSec: 40.0,
        durationSec: 7.0,
        chord: "Em",
        targetMidi: 59, // B3
        text: "¡Nena, no te peines en la cama, que los viajantes se van a atrasar!",
        breatheBefore: true,
        technique: "mixed",
        coachNote: "Respira rápido costodiafragmático antes de 'Nena' y articula consonantes.",
      },
    ],
  },
];

const TECHNIQUE_BADGES: Record<VocalTechnique, { label: string; shortLabel: string; color: string }> = {
  chest: {
    label: "Voz de Pecho",
    shortLabel: "Pecho",
    color: "bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40",
  },
  mixed: {
    label: "Voz Mixta",
    shortLabel: "Mixta",
    color: "bg-[#BF5AF2]/20 text-[#BF5AF2] border-[#BF5AF2]/40",
  },
  head: {
    label: "Voz de Cabeza",
    shortLabel: "Cabeza",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  support: {
    label: "Apoyo Diafragmático",
    shortLabel: "Apoyo",
    color: "bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40",
  },
};

export default function RepertoireCoachView({
  currentPitch,
  isListening,
  onToggleMic,
}: RepertoireCoachViewProps) {
  const [songs, setSongs] = useState<RepertoireSong[]>(PRESET_SONGS);
  const [activeSongId, setActiveSongId] = useState<string>("lamento-boliviano");
  const [selectedLineId, setSelectedLineId] = useState<string>("lb-5");

  // Estado del Teleprompter Sincronizado (Apple Music Sing)
  const [isPlayingPrompter, setIsPlayingPrompter] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);

  // Reproductor de Audio y Acompañamiento Acústico
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [customAudioUrls, setCustomAudioUrls] = useState<Record<string, string>>({});
  const [useSynthAccompaniment, setUseSynthAccompaniment] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const lastChordPlayedRef = useRef<string | null>(null);

  // Estado del Buscador Open-Source LRCLIB
  const [activeDrawer, setActiveDrawer] = useState<"none" | "lrclib" | "import" | "addLine">("none");
  const [searchQuery, setSearchQuery] = useState<string>("Enanitos Verdes Lamento Boliviano");
  const [isSearchingLrc, setIsSearchingLrc] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<LrcLibSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Estado del Importador UltraStar / ChordPro
  const [importMode, setImportMode] = useState<"chordpro" | "ultrastar">("chordpro");
  const [importTitle, setImportTitle] = useState<string>("");
  const [importArtist, setImportArtist] = useState<string>("");
  const [importRawText, setImportRawText] = useState<string>(
    "[Em]Me quieren agitar [Bm7]me incitan a gritar\n[Am7]Adentro hay un volcán [Em]que pronto va a estallar"
  );

  // Estado para añadir frase suelta rápida
  const [newLineText, setNewLineText] = useState<string>("");
  const [newLineChord, setNewLineChord] = useState<string>("Em");
  const [newLineNote, setNewLineNote] = useState<string>("");

  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSong = songs.find((s) => s.id === activeSongId) || songs[0];
  const activeAudioUrl = customAudioUrls[activeSong.id] || activeSong.audioUrl || null;

  // Manejo de carga de archivo de audio MP3 local
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCustomAudioUrls((prev) => ({ ...prev, [activeSong.id]: url }));
    setIsPlayingPrompter(false);
    setCurrentTimeSec(0);
    lastChordPlayedRef.current = null;
  };

  // Alternar reproducción general (Audio MP3 o Acompañamiento Sintetizado)
  const handleTogglePlay = () => {
    const nextState = !isPlayingPrompter;
    setIsPlayingPrompter(nextState);

    if (activeAudioUrl && audioRef.current) {
      if (nextState) {
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.currentTime = currentTimeSec;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }

    if (!nextState) {
      vocalSynth.stopAll();
      lastChordPlayedRef.current = null;
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTimeSec(newTime);
    if (activeAudioUrl && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    const activeLine = activeSong.lines.find(
      (l) => newTime >= l.startTimeSec && newTime < l.startTimeSec + l.durationSec
    );
    if (activeLine) {
      setSelectedLineId(activeLine.id);
      if (useSynthAccompaniment && !activeAudioUrl && activeLine.chord) {
        vocalSynth.playChord(chordNameToMidi(activeLine.chord), Math.max(2.0, activeLine.durationSec), volume * 0.22);
      }
    }
  };

  // Reloj del Teleprompter en vivo (sincronizado con Audio o Sintetizador)
  useEffect(() => {
    if (!isPlayingPrompter) return;

    // Si hay audio real, sincronizar con timeupdate del elemento de audio
    if (activeAudioUrl && audioRef.current) {
      const audioEl = audioRef.current;
      const handleAudioTimeUpdate = () => {
        const now = audioEl.currentTime;
        setCurrentTimeSec(now);

        const activeLine = activeSong.lines.find(
          (l) => now >= l.startTimeSec && now < l.startTimeSec + l.durationSec
        );
        if (activeLine && activeLine.id !== selectedLineId) {
          setSelectedLineId(activeLine.id);
          const el = lineRefs.current[activeLine.id];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      const handleAudioEnded = () => {
        setIsPlayingPrompter(false);
        setCurrentTimeSec(0);
        lastChordPlayedRef.current = null;
      };

      audioEl.addEventListener("timeupdate", handleAudioTimeUpdate);
      audioEl.addEventListener("ended", handleAudioEnded);
      return () => {
        audioEl.removeEventListener("timeupdate", handleAudioTimeUpdate);
        audioEl.removeEventListener("ended", handleAudioEnded);
      };
    }

    // Modo Acompañamiento Sintetizado (Acordes de piano en tiempo real)
    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = Math.round((prev + 0.2) * 10) / 10;
        const activeLine = activeSong.lines.find(
          (l) => next >= l.startTimeSec && next < l.startTimeSec + l.durationSec
        );
        if (activeLine) {
          if (activeLine.id !== selectedLineId) {
            setSelectedLineId(activeLine.id);
            const el = lineRefs.current[activeLine.id];
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          // Disparar acordes acústicos en tiempo real para que el usuario SIEMPRE escuche música
          if (useSynthAccompaniment && activeLine.chord && activeLine.chord !== lastChordPlayedRef.current) {
            lastChordPlayedRef.current = activeLine.chord;
            const notes = chordNameToMidi(activeLine.chord);
            vocalSynth.playChord(notes, Math.max(2.4, activeLine.durationSec), volume * 0.22);
          }
        }

        if (next >= activeSong.durationSec) {
          setIsPlayingPrompter(false);
          vocalSynth.stopAll();
          lastChordPlayedRef.current = null;
          return 0;
        }

        return next;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlayingPrompter, activeSong, selectedLineId, activeAudioUrl, useSynthAccompaniment, volume]);

  const handleSearchLrcLib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchingLrc(true);
    setSearchError(null);
    try {
      const results = await searchLrcLibCatalog(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No se encontraron letras sincronizadas con ese nombre. Intenta con 'Artista Canción'.");
      }
    } catch {
      setSearchError("Error de red al consultar LRCLIB. Verifica tu conexión.");
    } finally {
      setIsSearchingLrc(false);
    }
  };

  const handleImportFromLrcLib = (item: LrcLibSearchResult) => {
    const parsedLines = parseLrcToLines(item.syncedLyrics, item.plainLyrics, 52);
    const newSong: RepertoireSong = {
      id: `lrclib-${item.id}-${Date.now()}`,
      title: item.trackName || item.name,
      artist: item.artistName,
      album: item.albumName,
      keySignature: item.syncedLyrics ? "LRC Sincronizado" : "Letra Estándar",
      bpm: 120,
      durationSec: item.duration || 180,
      sourceType: "lrclib",
      lines: parsedLines,
    };

    setSongs((prev) => [newSong, ...prev]);
    setActiveSongId(newSong.id);
    if (newSong.lines[0]) setSelectedLineId(newSong.lines[0].id);
    setCurrentTimeSec(0);
    setIsPlayingPrompter(false);
    setActiveDrawer("none");
  };

  const handleImportCustomFormat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importRawText.trim()) return;

    const newSong =
      importMode === "ultrastar"
        ? parseUltraStarTxt(importRawText)
        : parseChordProText(importTitle || "Canción de Clase", importArtist || "Mi Repertorio", importRawText, 52);

    setSongs((prev) => [newSong, ...prev]);
    setActiveSongId(newSong.id);
    if (newSong.lines[0]) setSelectedLineId(newSong.lines[0].id);
    setCurrentTimeSec(0);
    setIsPlayingPrompter(false);
    setActiveDrawer("none");
  };

  const toggleBreathMark = (lineId: string) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id !== activeSong.id
          ? song
          : {
              ...song,
              lines: song.lines.map((l) =>
                l.id === lineId ? { ...l, breatheBefore: !l.breatheBefore } : l
              ),
            }
      )
    );
  };

  const cycleTechnique = (lineId: string) => {
    const order: VocalTechnique[] = ["chest", "mixed", "support", "head"];
    setSongs((prev) =>
      prev.map((song) =>
        song.id !== activeSong.id
          ? song
          : {
              ...song,
              lines: song.lines.map((l) => {
                if (l.id !== lineId) return l;
                const nextIdx = (order.indexOf(l.technique) + 1) % order.length;
                return { ...l, technique: order[nextIdx] };
              }),
            }
      )
    );
  };

  const shiftLineTargetMidi = (lineId: string, delta: number) => {
    setSongs((prev) =>
      prev.map((song) =>
        song.id !== activeSong.id
          ? song
          : {
              ...song,
              lines: song.lines.map((l) => {
                if (l.id !== lineId) return l;
                const nextMidi = Math.min(76, Math.max(40, l.targetMidi + delta));
                vocalSynth.playNote(nextMidi, 0.7, 0.3);
                return { ...l, targetMidi: nextMidi };
              }),
            }
      )
    );
  };

  const handleAddSingleLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineText.trim()) return;
    const lastLine = activeSong.lines[activeSong.lines.length - 1];
    const startSec = lastLine ? lastLine.startTimeSec + lastLine.durationSec : 0;

    const createdLine = {
      id: `custom-${Date.now()}`,
      startTimeSec: startSec,
      durationSec: 4.5,
      chord: newLineChord || "Em",
      targetMidi: 55,
      text: newLineText.trim(),
      breatheBefore: true,
      technique: "chest" as VocalTechnique,
      coachNote: newLineNote.trim() || "Mantener apoyo constante y garganta abierta.",
    };

    setSongs((prev) =>
      prev.map((s) => (s.id === activeSong.id ? { ...s, lines: [...s.lines, createdLine] } : s))
    );
    setNewLineText("");
    setNewLineNote("");
    setActiveDrawer("none");
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = Math.floor(sec % 60);
    return `${mins}:${rem.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Barra Superior de Acciones Mobile-First: Selector de Canción + Botones de Importación */}
      <div className="apple-glass rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Selector de Canción Activa */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full">
            {songs.map((song) => {
              const isCurrent = song.id === activeSong.id;
              return (
                <button
                  key={song.id}
                  onClick={() => {
                    setActiveSongId(song.id);
                    setIsPlayingPrompter(false);
                    setCurrentTimeSec(0);
                  }}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isCurrent
                      ? "bg-white text-black border-white shadow-md"
                      : "bg-white/[0.06] text-zinc-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Music2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{song.title}</span>
                </button>
              );
            })}
          </div>

          {/* Botones para abrir el catálogo LRCLIB o importar UltraStar/ChordPro */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveDrawer(activeDrawer === "lrclib" ? "none" : "lrclib")}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-2xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(10,132,255,0.35)] transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Buscar Canción (LRCLIB)</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === "import" ? "none" : "import")}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-[#BF5AF2]" />
              <span>ChordPro / UltraStar</span>
            </button>

            <button
              onClick={() => setActiveDrawer(activeDrawer === "addLine" ? "none" : "addLine")}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 transition cursor-pointer"
              title="Añadir verso manual"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DRAWER 1: Buscador en Vivo LRCLIB (3M+ Letras Sincronizadas Gratuitas) */}
        {activeDrawer === "lrclib" && (
          <div className="p-4 rounded-2xl bg-black/70 border border-white/15 flex flex-col gap-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-[#0A84FF]" />
                  Catálogo Abierto LRCLIB (Letras Sincronizadas .LRC)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Descarga instantánea con tiempos exactos estilo Apple Music Sing (100% gratis, sin API Key)
                </p>
              </div>
              <button
                onClick={() => setActiveDrawer("none")}
                className="p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchLrcLib} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ej. Soda Stereo Musica Ligera, Luis Miguel, Caifanes..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0A84FF]"
              />
              <button
                type="submit"
                disabled={isSearchingLrc}
                className="px-5 py-2.5 rounded-xl bg-[#0A84FF] text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isSearchingLrc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Buscar</span>
              </button>
            </form>

            {searchError && <p className="text-xs text-amber-400">{searchError}</p>}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleImportFromLrcLib(item)}
                    className="p-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-left flex items-center justify-between gap-2 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{item.trackName || item.name}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{item.artistName}</div>
                      <span
                        className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          item.syncedLyrics
                            ? "bg-[#30D158]/20 text-[#30D158]"
                            : "bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        {item.syncedLyrics ? "⚡ Sincronizada (.LRC)" : "Letra Estándar"}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DRAWER 2: Importador Open-Source ChordPro / UltraStar .TXT */}
        {activeDrawer === "import" && (
          <form
            onSubmit={handleImportCustomFormat}
            className="p-4 rounded-2xl bg-black/70 border border-white/15 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("chordpro")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    importMode === "chordpro" ? "bg-[#BF5AF2] text-white" : "bg-white/10 text-zinc-400"
                  }`}
                >
                  Formato ChordPro ([Em]Letra)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("ultrastar")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    importMode === "ultrastar" ? "bg-[#30D158] text-black" : "bg-white/10 text-zinc-400"
                  }`}
                >
                  Mapa Karaoke UltraStar (.TXT)
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer("none")}
                className="p-1.5 rounded-full bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importMode === "chordpro" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Título de la canción"
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Artista / Tonalidad"
                  value={importArtist}
                  onChange={(e) => setImportArtist(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white"
                />
              </div>
            )}

            <textarea
              rows={4}
              value={importRawText}
              onChange={(e) => setImportRawText(e.target.value)}
              placeholder={
                importMode === "chordpro"
                  ? "Pega aquí tu canción en formato ChordPro, ej: [Em]Me quieren agitar [Bm7]me incitan a gritar..."
                  : "Pega aquí el contenido de un archivo .TXT de UltraStar Deluxe (#TITLE:..., : 0 4 7 Sí-la-ba)..."
              }
              className="w-full p-3 rounded-xl bg-white/[0.07] border border-white/15 text-xs font-mono text-white"
            />

            <button
              type="submit"
              className="py-2.5 rounded-xl bg-[#30D158] text-black font-semibold text-xs shadow-[0_0_20px_rgba(48,209,88,0.35)] cursor-pointer hover:brightness-105"
            >
              Convertir e Importar al Teleprompter
            </button>
          </form>
        )}

        {/* DRAWER 3: Añadir Frase Rápida de Clase */}
        {activeDrawer === "addLine" && (
          <form
            onSubmit={handleAddSingleLine}
            className="p-4 rounded-2xl bg-black/70 border border-white/15 flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Añadir Frase e Indicación del Profesor</span>
              <button
                type="button"
                onClick={() => setActiveDrawer("none")}
                className="p-1 rounded-full bg-white/10 text-zinc-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Letra del verso..."
              value={newLineText}
              onChange={(e) => setNewLineText(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Acorde (ej. Em, Bm7)"
                value={newLineChord}
                onChange={(e) => setNewLineChord(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Nota técnica (ej. Abrir vocal)"
                value={newLineNote}
                onChange={(e) => setNewLineNote(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-xs text-white"
              />
            </div>
            <button type="submit" className="py-2.5 rounded-xl bg-[#0A84FF] text-white font-semibold text-xs cursor-pointer hover:bg-[#0070E0]">
              Agregar a la Canción Actual
            </button>
          </form>
        )}
      </div>

      {/* Teleprompter Principal Estilo Apple Music Sing */}
      <div className="apple-glass rounded-3xl p-4 sm:p-7 flex flex-col gap-4">
        {/* Elemento de Audio Nativo para Reproducción de Pistas */}
        <audio ref={audioRef} src={activeAudioUrl || undefined} preload="auto" />

        {/* Cabecera + Reproductor de Pista Karaoke y Acompañamiento */}
        <div className="flex flex-col gap-3.5 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#30D158]/20 text-[#30D158]">
                  {activeSong.keySignature}
                </span>
                <span className="text-xs text-zinc-400">{activeSong.bpm} BPM</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeAudioUrl ? "Pista MP3 Cargada" : "Acompañamiento Acústico Sintetizado"}
                </span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white mt-1">
                {activeSong.title}{" "}
                <span className="text-zinc-400 font-normal text-sm sm:text-lg">— {activeSong.artist}</span>
              </h2>
            </div>

            {/* Selector de Micrófono de Evaluación (Aislado para Karaoke) */}
            {onToggleMic && (
              <button
                type="button"
                onClick={onToggleMic}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  isListening
                    ? "bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40 shadow-[0_0_12px_rgba(48,209,88,0.3)]"
                    : "bg-white/10 text-zinc-300 border-white/10 hover:bg-white/15"
                }`}
                title="Activar/desactivar micrófono exclusivo para evaluación de afinación en karaoke"
              >
                {isListening ? <Mic className="w-3.5 h-3.5 text-[#30D158]" /> : <MicOff className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{isListening ? "Mic On (Evaluando)" : "Mic en Pausa (Pura Pista)"}</span>
              </button>
            )}
          </div>

          {/* Consola de Control de Audio Karaoke: Play/Pausa, Scrubber, Volumen y Carga MP3 */}
          <div className="bg-black/50 p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Botones de Transporte */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                    isPlayingPrompter
                      ? "bg-amber-400 text-black shadow-[0_0_18px_rgba(251,191,36,0.4)]"
                      : "bg-[#30D158] text-black shadow-[0_0_20px_rgba(48,209,88,0.5)] hover:brightness-105"
                  }`}
                >
                  {isPlayingPrompter ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{isPlayingPrompter ? "Pausar Pista" : "Reproducir Pista & Letra"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlayingPrompter(false);
                    handleSeek(0);
                    vocalSynth.stopAll();
                    if (activeSong.lines[0]) setSelectedLineId(activeSong.lines[0].id);
                  }}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 transition cursor-pointer"
                  title="Reiniciar canción al inicio"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Subir MP3 de Karaoke */}
                <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span className="hidden sm:inline">Subir Pista MP3</span>
                  <span className="sm:hidden">MP3</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Controles de Sonido: Acompañamiento Sintetizado y Volumen */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = !useSynthAccompaniment;
                    setUseSynthAccompaniment(next);
                    if (!next) vocalSynth.stopAll();
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    useSynthAccompaniment
                      ? "bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/40"
                      : "bg-white/5 text-zinc-500 border-transparent"
                  }`}
                  title="Genera acordes de piano y armonía acústica en tiempo real para canciones sin MP3"
                >
                  <Radio className="w-3 h-3" />
                  <span>Piano Acordes</span>
                </button>

                {/* Volumen */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/10">
                  {volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-zinc-300" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (audioRef.current) audioRef.current.volume = v;
                    }}
                    className="w-16 accent-[#0A84FF] cursor-pointer"
                    title="Volumen de la pista"
                  />
                </div>
              </div>
            </div>

            {/* Barra de Progreso y Tiempo (Scrubber) */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-mono text-zinc-400 min-w-[36px]">
                {formatSeconds(currentTimeSec)}
              </span>
              <input
                type="range"
                min="0"
                max={activeSong.durationSec || 60}
                step="0.2"
                value={currentTimeSec}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 accent-[#30D158] h-1.5 bg-zinc-800 rounded-full cursor-pointer"
              />
              <span className="text-[11px] font-mono text-zinc-500 min-w-[36px] text-right">
                {formatSeconds(activeSong.durationSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Versos Interactivos (Optimizada para Pulgar en Mobile) */}
        <div className="flex flex-col gap-3 max-h-[62vh] overflow-y-auto pr-1">
          {activeSong.lines.map((line) => {
            const isSelected = selectedLineId === line.id;
            const badge = TECHNIQUE_BADGES[line.technique];
            const isMatchingNote = currentPitch && Math.abs(currentPitch.midi - line.targetMidi) <= 1;

            return (
              <div
                key={line.id}
                ref={(el) => {
                  lineRefs.current[line.id] = el;
                }}
                onClick={() => {
                  setSelectedLineId(line.id);
                  setCurrentTimeSec(line.startTimeSec);
                }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.11] border-white/35 shadow-[0_8px_30px_rgba(0,0,0,0.5)] scale-[1.01]"
                    : "bg-white/[0.03] border-white/[0.07] opacity-80 hover:opacity-100"
                }`}
              >
                {/* Fila Superior de Píldoras Táctiles */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Botón de Marca de Respiración */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBreathMark(line.id);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition border cursor-pointer ${
                        line.breatheBefore
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-white/5 text-zinc-500 border-transparent"
                      }`}
                    >
                      <Wind className="w-3 h-3" />
                      <span>{line.breatheBefore ? "Respirar" : "Continuo"}</span>
                    </button>

                    {/* Acorde */}
                    <span className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white text-xs font-mono font-bold">
                      {line.chord}
                    </span>

                    {/* Botón de Nota Guía + Ajuste de Semitono */}
                    <div className="flex items-center rounded-xl bg-white/10 p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          shiftLineTargetMidi(line.id, -1);
                        }}
                        className="px-2 py-1 text-xs text-zinc-300 hover:text-white cursor-pointer"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          vocalSynth.playNote(line.targetMidi, 1.1, 0.35);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isMatchingNote ? "bg-[#30D158] text-black font-bold" : "text-zinc-100"
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{midiToNoteName(line.targetMidi)}</span>
                        {isMatchingNote && <Check className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          shiftLineTargetMidi(line.id, 1);
                        }}
                        className="px-2 py-1 text-xs text-zinc-300 hover:text-white cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Selector de Registro Vocal (Pecho / Mixta / Apoyo / Cabeza) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleTechnique(line.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border cursor-pointer ${badge.color}`}
                  >
                    <span className="sm:hidden">{badge.shortLabel}</span>
                    <span className="hidden sm:inline">{badge.label}</span>
                  </button>
                </div>

                {/* Letra Principal estilo Apple Music Sing */}
                <p
                  className={`text-lg sm:text-2xl font-bold tracking-tight leading-snug transition-colors ${
                    isSelected ? "text-white" : "text-zinc-300"
                  }`}
                >
                  {line.text}
                </p>

                {/* Indicación del Coach Vocal */}
                <div className="mt-2.5 flex items-start gap-2 text-xs text-zinc-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#0A84FF] shrink-0 mt-0.5" />
                  <span>{line.coachNote}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
