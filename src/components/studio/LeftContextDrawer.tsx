"use client";

import React, { useState, useRef, useEffect } from "react";
import { useVocalSession, DrawerTab } from "@/store/vocalSessionStore";
import { VOCAL_EXERCISES, VocalExercise } from "@/components/VocalTrainerSuite";
import { SINGING_SIMPLIFIED_COURSE, LessonItem } from "@/data/singingSimplifiedCourse";
import { StudioSong, fetchSongMetadataAndLyrics, parsePlainLyrics, LyricLine } from "@/lib/musicUtils";
import { midiToNoteName, SOLFEGE_NAMES, NOTE_NAMES } from "@/lib/vocalEngine";
import YouTubeLibraryImporter from "./YouTubeLibraryImporter";
import { StudyTrack, studyLibraryStorage } from "@/services/studyLibraryStorage";
import {
  Music,
  Disc,
  GraduationCap,
  Layers,
  Play,
  Square,
  Pause,
  Upload,
  Search,
  CheckCircle2,
  ChevronRight,
  Wind,
  Sparkles,
  Sliders,
  Volume2,
  Trash2,
  RotateCcw,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";

export default function LeftContextDrawer() {
  const {
    activeDrawerTab,
    setActiveDrawerTab,
    isDrawerOpen,
    activeExercise,
    exerciseRootMidi,
    setExerciseRootMidi,
    exerciseBpm,
    setExerciseBpm,
    isPlayingExercise,
    startExercise,
    stopExercise,
    songsLibrary,
    activeSong,
    loadSong,
    isPlayingSong,
    songTime,
    songDuration,
    playbackRate,
    setPlaybackRate,
    togglePlaySong,
    seekSong,
    takesList,
    ghostTake,
    setGhostTake,
    startRecordingTake,
    isRecordingTake,
    vocalProfile,
  } = useVocalSession();

  // Estados locales para canciones y búsqueda LRCLIB
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [isSearchingLyrics, setIsSearchingLyrics] = useState(false);
  const [lyricsSearchResult, setLyricsSearchResult] = useState<StudioSong | null>(null);

  // Estados locales de Librería de Estudio persistente en IndexedDB
  const [studyTracks, setStudyTracks] = useState<StudyTrack[]>([]);

  useEffect(() => {
    studyLibraryStorage
      .getAllTracks()
      .then((tracks) => {
        setStudyTracks(tracks);
      })
      .catch((err) => {
        console.warn("Error cargando pistas de IndexedDB:", err);
      });
  }, []);

  const studyTrackToStudioSong = (track: StudyTrack): StudioSong => {
    const lyrics: LyricLine[] =
      track.syncedLyrics.length > 0
        ? track.syncedLyrics.map((sl, idx) => ({
            id: `line-${idx}`,
            time: sl.timeMs / 1000,
            text: sl.text,
            vocalCue: "Apoyo diafragmático y afinación centrada",
          }))
        : parsePlainLyrics(track.plainLyrics || `[00:00.00] ${track.title}\n[00:04.00] ${track.artist}`);

    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      coverUrl: track.thumbnailUrl,
      duration: track.durationSec,
      audioUrl: track.audioObjectUrl || (track.audioBlob ? URL.createObjectURL(track.audioBlob) : ""),
      lyrics,
      isSynced: track.syncedLyrics.length > 0,
      createdAt: track.createdAt,
    };
  };

  const handleSelectStudyTrack = (track: StudyTrack) => {
    const song = studyTrackToStudioSong(track);
    loadSong(song);
  };

  const handleStudyTrackAdded = (track: StudyTrack) => {
    setStudyTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
    const song = studyTrackToStudioSong(track);
    loadSong(song);
  };

  const handleStudyTrackDeleted = (id: string) => {
    setStudyTracks((prev) => prev.filter((t) => t.id !== id));
  };

  // Estados locales para Academia
  const [selectedLesson, setSelectedLesson] = useState<LessonItem | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number>(1);
  const [academyTimer, setAcademyTimer] = useState<number | null>(null);
  const academyTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para ejercicio de respiración 4-4-8
  const [breathingPhase, setBreathingPhase] = useState<"Inhala (4s)" | "Sostén (4s)" | "Exhala (8s)" | null>(null);
  const [breathingTimer, setBreathingTimer] = useState<number>(0);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manejador de respiración diafragmática
  const toggleBreathingExercise = () => {
    if (breathingPhase) {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
      setBreathingPhase(null);
      setBreathingTimer(0);
    } else {
      let phaseIndex = 0;
      let count = 4;
      setBreathingPhase("Inhala (4s)");
      setBreathingTimer(count);

      breathingIntervalRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          phaseIndex = (phaseIndex + 1) % 3;
          if (phaseIndex === 0) {
            count = 4;
            setBreathingPhase("Inhala (4s)");
          } else if (phaseIndex === 1) {
            count = 4;
            setBreathingPhase("Sostén (4s)");
          } else {
            count = 8;
            setBreathingPhase("Exhala (8s)");
          }
        }
        setBreathingTimer(count);
      }, 1000);
    }
  };

  // Subir archivo MP3 local
  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    const newSong: StudioSong = {
      id: `local-${Date.now()}`,
      title: cleanName,
      artist: "Archivo Local",
      audioUrl: objectUrl,
      audioFileName: file.name,
      lyrics: parsePlainLyrics(`[00:00.00] ${cleanName}\n[00:05.00] Práctica libre con pista`),
      isSynced: true,
      createdAt: Date.now(),
    };

    loadSong(newSong);
  };

  // Buscar letras sincronizadas en LRCLIB
  const handleSearchLRCLIB = async () => {
    if (!songSearchQuery.trim()) return;
    setIsSearchingLyrics(true);
    try {
      const parts = songSearchQuery.split("-");
      const titleQuery = parts[0]?.trim() || songSearchQuery;
      const artistQuery = parts[1]?.trim() || "";
      const result = await fetchSongMetadataAndLyrics(titleQuery, artistQuery);
      if (result) {
        const songObj: StudioSong = {
          id: `lrclib-${Date.now()}`,
          title: result.title,
          artist: result.artist,
          album: result.album,
          coverUrl: result.coverUrl,
          duration: result.duration,
          audioUrl: "",
          lyrics: result.lyrics,
          isSynced: result.isAlreadySynced,
          createdAt: Date.now(),
        };
        setLyricsSearchResult(songObj);
      } else {
        alert("No se encontraron letras para esta búsqueda.");
      }
    } catch {
      alert("Error consultando LRCLIB.");
    } finally {
      setIsSearchingLyrics(false);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <aside className="w-80 sm:w-[340px] bg-[#11131A] border-r border-white/[0.08] flex flex-col shrink-0 select-none h-full z-20">
      {/* Selector de Pestañas Superiores */}
      <div className="p-2 border-b border-white/[0.08] bg-[#0E1017]">
        <div className="grid grid-cols-4 gap-1 bg-black/50 p-1 rounded-2xl border border-white/[0.06]">
          <button
            onClick={() => setActiveDrawerTab("vocalize")}
            className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeDrawerTab === "vocalize"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music size={14} />
            <span className="text-[10px] tracking-tight">Vocalizar</span>
          </button>

          <button
            onClick={() => setActiveDrawerTab("songs")}
            className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeDrawerTab === "songs"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Disc size={14} />
            <span className="text-[10px] tracking-tight">Canciones</span>
          </button>

          <button
            onClick={() => setActiveDrawerTab("academy")}
            className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeDrawerTab === "academy"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <GraduationCap size={14} />
            <span className="text-[10px] tracking-tight">Academia</span>
          </button>

          <button
            onClick={() => setActiveDrawerTab("takes")}
            className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
              activeDrawerTab === "takes"
                ? "bg-white text-black shadow-md font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Layers size={14} />
            <span className="text-[10px] tracking-tight">Bitácora</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: VOCALIZACIONES & ESCALAS                      */}
      {/* ======================================================== */}
      {activeDrawerTab === "vocalize" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Controles de Tonalidad y BPM */}
          <div className="bg-[#161822] border border-white/10 p-3.5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
              <span>Nota Base (Tonalidad)</span>
              <span className="font-bold text-white">
                {midiToNoteName(exerciseRootMidi, "both")}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px]">
              {[43, 45, 48, 50, 52].map((midi) => (
                <button
                  key={midi}
                  onClick={() => setExerciseRootMidi(midi)}
                  className={`py-1 rounded-lg border transition ${
                    exerciseRootMidi === midi
                      ? "bg-blue-600 text-white border-blue-400 font-bold"
                      : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {midiToNoteName(midi, "solfege").split(" ")[0]}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-1">
              <span>Tempo de Escala</span>
              <span className="font-bold text-amber-400">{exerciseBpm} BPM</span>
            </div>
            <input
              type="range"
              min="75"
              max="140"
              value={exerciseBpm}
              onChange={(e) => setExerciseBpm(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Rutinas de Vocalización */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Rutinas Disponibles (Inyectan escalones al lienzo)
            </span>

            {VOCAL_EXERCISES.map((ex) => {
              const isSelected = activeExercise?.id === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-950/30"
                      : "bg-[#141620] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-xs">{ex.title}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                      {ex.categoryLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2.5">
                    {ex.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="font-mono text-[10px] text-blue-300">
                      Fonética: {ex.phonetic}
                    </span>

                    {isSelected && isPlayingExercise ? (
                      <button
                        onClick={stopExercise}
                        className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1 transition"
                      >
                        <Square size={10} className="fill-white" />
                        <span>Parar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startExercise(ex)}
                        className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition shadow-md shadow-blue-600/30"
                      >
                        <Play size={10} className="fill-white" />
                        <span>Practicar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Respiración Diafragmática 4-4-8 */}
          <div className="bg-[#141620] border border-white/10 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Wind size={13} className="text-emerald-400" />
                Respiración 4-4-8
              </span>
              <button
                onClick={toggleBreathingExercise}
                className={`px-2.5 py-1 rounded-xl font-bold text-[10px] transition ${
                  breathingPhase
                    ? "bg-red-600 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {breathingPhase ? "Detener" : "Iniciar"}
              </button>
            </div>
            {breathingPhase ? (
              <div className="text-center py-2 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
                <div className="text-sm font-bold text-emerald-300">{breathingPhase}</div>
                <div className="text-2xl font-black text-white font-mono mt-0.5">{breathingTimer}s</div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Oxigena el diafragma y relaja las cuerdas vocales antes de cantar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: CANCIONES & KARAOKE (LRCLIB + YOUTUBE MP3)    */}
      {/* ======================================================== */}
      {activeDrawerTab === "songs" && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Controles de Reproducción de la Canción Activa */}
          {activeSong && (
            <div className="bg-[#141620] border-b border-white/10 p-3.5 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 mr-2">
                  <div className="font-bold text-white text-xs truncate">
                    {activeSong.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{activeSong.artist}</div>
                </div>
                <button
                  type="button"
                  onClick={togglePlaySong}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition shrink-0"
                  title={isPlayingSong ? "Pausar pista" : "Reproducir pista"}
                >
                  {isPlayingSong ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
              </div>

              {/* Barra de Progreso */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={songDuration || 100}
                  value={songTime}
                  onChange={(e) => seekSong(parseFloat(e.target.value))}
                  className="w-full accent-blue-400 cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[9px] text-zinc-500">
                  <span>{Math.floor(songTime / 60)}:{(Math.floor(songTime) % 60).toString().padStart(2, "0")}</span>
                  <span>{Math.floor(songDuration / 60)}:{(Math.floor(songDuration) % 60).toString().padStart(2, "0")}</span>
                </div>
              </div>

              {/* Selector de Velocidad */}
              <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                <span>Velocidad:</span>
                <div className="flex gap-1">
                  {[0.8, 1.0, 1.1].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-2 py-0.5 rounded-md border ${
                        playbackRate === rate
                          ? "bg-blue-600 text-white border-blue-400 font-bold"
                          : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Importador YouTube a MP3 y Gestor de Librería de Estudio */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <YouTubeLibraryImporter
              tracks={studyTracks}
              activeTrackId={activeSong?.id}
              onSelectTrack={handleSelectStudyTrack}
              onTrackAdded={handleStudyTrackAdded}
              onTrackDeleted={handleStudyTrackDeleted}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: ACADEMIA (SINGING SIMPLIFIED)                  */}
      {/* ======================================================== */}
      {activeDrawerTab === "academy" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Secciones de Steve Glazer */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Módulos del Curso
            </span>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
              {SINGING_SIMPLIFIED_COURSE.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`p-2 rounded-xl border text-left transition ${
                    activeSectionId === sec.id
                      ? "bg-purple-950/40 border-purple-500/50 text-white font-bold"
                      : "bg-[#141620] border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="truncate font-semibold">{sec.badge}</div>
                  <div className="text-[9px] text-zinc-500">Módulo {sec.id}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Lecciones de la Sección Activa */}
          <div className="space-y-2">
            {SINGING_SIMPLIFIED_COURSE.find((s) => s.id === activeSectionId)?.lessons.map((lesson) => (
              <div
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  selectedLesson?.id === lesson.id
                    ? "bg-purple-950/40 border-purple-500/50 text-white"
                    : "bg-[#141620] border-white/10 hover:border-white/20 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{lesson.title}</span>
                  <span className="font-mono text-[9px] text-purple-400 font-bold">
                    {lesson.lessonNumber}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                  {lesson.description}
                </p>

                {lesson.scalePattern && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startExercise({
                        id: lesson.id,
                        category: "agility",
                        categoryLabel: "Lección Academia",
                        title: lesson.title,
                        phonetic: lesson.vowelPrompt || "La - La - La",
                        description: lesson.description,
                        intervals: lesson.scalePattern || [0, 2, 4, 7, 4, 2, 0],
                        tempoBpm: lesson.bpm || 110,
                      });
                    }}
                    className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition"
                  >
                    <Play size={10} className="fill-white" />
                    <span>Inyectar Escala al Lienzo & Piano</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: BITÁCORA A/B (TOMAS Y COMPARACIÓN FANTASMA)    */}
      {/* ======================================================== */}
      {activeDrawerTab === "takes" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Historial de Tomas Grabadas
            </span>
            <span className="font-mono text-[10px] text-zinc-400">{takesList.length} tomas</span>
          </div>

          {takesList.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              No hay tomas grabadas aún. Usa el botón <strong className="text-red-400">● REC</strong> en la barra superior para capturar tu práctica.
            </div>
          ) : (
            <div className="space-y-2.5">
              {takesList.map((take) => {
                const isGhost = ghostTake?.id === take.id;
                return (
                  <div
                    key={take.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isGhost
                        ? "bg-emerald-950/30 border-emerald-500/50 shadow-lg"
                        : "bg-[#141620] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{take.title}</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">
                        {take.avgAccuracy}% Precisión
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2.5">
                      <span>{take.timestamp}</span>
                      <span>Duración: {take.durationSec}s</span>
                    </div>

                    {take.audioUrl && (
                      <audio controls src={take.audioUrl} className="w-full h-7 mb-2" />
                    )}

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => setGhostTake(isGhost ? null : take)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer ${
                          isGhost
                            ? "bg-emerald-600 text-white"
                            : "bg-white/10 hover:bg-white/20 text-zinc-300"
                        }`}
                      >
                        {isGhost ? "Toma A Activa (Lienzo)" : "Fijar como Toma A"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
