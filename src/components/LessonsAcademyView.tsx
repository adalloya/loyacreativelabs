"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SINGING_SIMPLIFIED_COURSE,
  SectionGroup,
  LessonItem,
} from "@/data/singingSimplifiedCourse";
import { vocalSynth, midiToNoteName } from "@/lib/vocalEngine";
import {
  BookOpen,
  CheckCircle2,
  Play,
  Square,
  Search,
  Sparkles,
  Volume2,
  Clock,
  RotateCcw,
  ChevronRight,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function LessonsAcademyView() {
  const [selectedSectionId, setSelectedSectionId] = useState<number>(1);
  const [selectedLessonId, setSelectedLessonId] = useState<string>("l1-1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  // Sintetizador de ejercicio activo
  const [exerciseRootMidi, setExerciseRootMidi] = useState<number>(48); // C3
  const [isPlayingPattern, setIsPlayingPattern] = useState<boolean>(false);
  const patternTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Temporizador de práctica
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar progreso de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("voxstudio_completed_lessons");
      if (saved) {
        setCompletedLessons(JSON.parse(saved));
      }
    } catch {
      // Ignorar en privado
    }
  }, []);

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) => {
      const next = { ...prev, [lessonId]: !prev[lessonId] };
      try {
        localStorage.setItem("voxstudio_completed_lessons", JSON.stringify(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  };

  // Encontrar la lección actual
  const allLessons = SINGING_SIMPLIFIED_COURSE.flatMap((s) => s.lessons);
  const filteredLessons = searchQuery.trim()
    ? allLessons.filter(
        (l) =>
          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.instructions.some((inst) => inst.toLowerCase().includes(searchQuery.toLowerCase())) ||
          l.tips.some((tip) => tip.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const currentSection =
    SINGING_SIMPLIFIED_COURSE.find((s) => s.id === selectedSectionId) ||
    SINGING_SIMPLIFIED_COURSE[0];

  const currentLesson =
    allLessons.find((l) => l.id === selectedLessonId) || currentSection.lessons[0];

  // Reproducir el patrón de notas de la lección
  const playLessonPattern = (pattern: number[], bpm = 65) => {
    if (isPlayingPattern) {
      if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
      vocalSynth.stopAll();
      setIsPlayingPattern(false);
      return;
    }

    setIsPlayingPattern(true);
    const intervalMs = (60 / bpm) * 1000;

    let step = 0;
    const playNext = () => {
      if (step >= pattern.length) {
        setIsPlayingPattern(false);
        return;
      }
      const noteMidi = exerciseRootMidi + pattern[step];
      vocalSynth.playNote(noteMidi, (intervalMs / 1000) * 0.9, 0.32);
      step++;
      patternTimeoutRef.current = setTimeout(playNext, intervalMs);
    };

    playNext();
  };

  // Detener audio al desmontar o cambiar de lección
  useEffect(() => {
    if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
    vocalSynth.stopAll();
    setIsPlayingPattern(false);
    setIsTimerRunning(false);
    setTimerRemaining(null);
  }, [selectedLessonId]);

  // Manejo del cronómetro de práctica
  const startTimer = (seconds: number) => {
    if (isTimerRunning) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setIsTimerRunning(false);
      return;
    }
    setTimerRemaining(seconds);
    setIsTimerRunning(true);

    timerIntervalRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setIsTimerRunning(false);
          vocalSynth.playNote(72, 0.8, 0.35); // Chime de finalización
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cálculo de porcentaje completado global
  const totalLessonCount = allLessons.length;
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / totalLessonCount) * 100);

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header de la Academia con Barra de Progreso General */}
      <div className="apple-glass rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#30D158] flex items-center justify-center text-white shadow-[0_0_20px_rgba(10,132,255,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Método Singing Simplified
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  Steve Glazer
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                8 Secciones Completas • 36 Lecciones Prácticas con Audio Interactivo
              </p>
            </div>
          </div>

          {/* Medidor de Progreso */}
          <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-2xl border border-white/10">
            <Award className="w-4 h-4 text-[#30D158]" />
            <div className="text-right">
              <div className="text-[10px] text-zinc-400 font-mono uppercase">Tu Progreso</div>
              <div className="text-xs font-bold text-white">
                {completedCount}/{totalLessonCount} lecciones ({completionPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Barra Visual de Progreso */}
        <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/10">
          <div
            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#0A84FF] via-[#BF5AF2] to-[#30D158]"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* Buscador de Lecciones */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por técnica (ej. respiración, falsete, voz mixta, consonantes, paladar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#0A84FF]"
          />
        </div>

        {/* Selector de Secciones (Scroll Horizontal en Mobile) */}
        {!searchQuery.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SINGING_SIMPLIFIED_COURSE.map((section) => {
              const isSelected = section.id === selectedSectionId;
              const sectionCompleted = section.lessons.filter((l) => completedLessons[l.id]).length;

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id);
                    setSelectedLessonId(section.lessons[0].id);
                  }}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-white text-black border-white shadow-md scale-105"
                      : "bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <span>Sec. {section.id}</span>
                  <span className="text-[10px] opacity-75">
                    ({sectionCompleted}/{section.lessons.length})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Principal: Menú de Lecciones (Izq) + Visualizador Detallado (Der) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda: Lista de Lecciones de la Sección */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="apple-glass rounded-3xl p-5 flex flex-col gap-3 max-h-[680px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {searchQuery.trim()
                  ? `Resultados (${filteredLessons.length})`
                  : currentSection.title}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {(searchQuery.trim() ? filteredLessons : currentSection.lessons).map((lesson) => {
                const isSelected = lesson.id === currentLesson.id;
                const isDone = completedLessons[lesson.id];

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-white/[0.12] border-white/30 shadow-lg"
                        : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/10 text-zinc-300">
                          {lesson.lessonNumber}
                        </span>
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158]" />}
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">
                        {lesson.title}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de la Lección Interactiva Activa */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="apple-glass rounded-3xl p-5 sm:p-7 flex flex-col gap-6">
            {/* Encabezado de la Lección */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#0A84FF]">
                    LECCIÓN {currentLesson.lessonNumber}
                  </span>
                  <span className="text-xs text-zinc-500">•</span>
                  <span className="text-xs text-zinc-400">{currentLesson.sectionTitle}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {currentLesson.title}
                </h1>
              </div>

              {/* Botón de Checkbox de Lección Completada */}
              <button
                onClick={() => toggleLessonCompleted(currentLesson.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                  completedLessons[currentLesson.id]
                    ? "bg-[#30D158]/20 text-[#30D158] border-[#30D158]/40 shadow-[0_0_15px_rgba(48,209,88,0.3)]"
                    : "bg-white/10 text-zinc-300 border-white/10 hover:bg-white/15"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedLessons[currentLesson.id] ? "¡Completada!" : "Marcar como Completada"}
                </span>
              </button>
            </div>

            {/* Descripción */}
            <p className="text-sm text-zinc-300 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {currentLesson.description}
            </p>

            {/* Barra de Práctica Interactiva de Audio (Si tiene escala o arpegio) */}
            {currentLesson.scalePattern && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0A84FF]/20 via-[#BF5AF2]/15 to-transparent border border-[#0A84FF]/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#0A84FF] text-white">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Escala del Ejercicio: {currentLesson.vowelPrompt || "Patrón Vocal"}
                    </div>
                    <div className="text-[11px] text-zinc-300">
                      Tono base: <strong>{midiToNoteName(exerciseRootMidi)}</strong>
                      {currentLesson.bpm && ` • ${currentLesson.bpm} BPM`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-black/50 p-1 border border-white/10">
                    <button
                      onClick={() => setExerciseRootMidi((r) => Math.max(36, r - 1))}
                      className="p-1.5 text-zinc-400 hover:text-white"
                      title="Bajar 1 semitono"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono font-bold px-2 text-white">
                      {midiToNoteName(exerciseRootMidi)}
                    </span>
                    <button
                      onClick={() => setExerciseRootMidi((r) => Math.min(64, r + 1))}
                      className="p-1.5 text-zinc-400 hover:text-white"
                      title="Subir 1 semitono"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      playLessonPattern(currentLesson.scalePattern!, currentLesson.bpm || 65)
                    }
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                      isPlayingPattern
                        ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                        : "bg-[#30D158] text-black shadow-[0_0_15px_rgba(48,209,88,0.4)] hover:brightness-105"
                    }`}
                  >
                    {isPlayingPattern ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isPlayingPattern ? "Detener" : "Tocar Escala en Piano"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Temporizador de Práctica (Si la lección incluye duración o meta en segundos) */}
            {currentLesson.timerSeconds && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Temporizador de Reto</div>
                    <div className="text-[11px] text-zinc-400">
                      Meta prescrita por Steve Glazer: {currentLesson.timerSeconds} segundos
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {timerRemaining !== null && (
                    <span className="text-lg font-mono font-bold text-white px-2">
                      {timerRemaining}s
                    </span>
                  )}
                  <button
                    onClick={() => startTimer(currentLesson.timerSeconds!)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isTimerRunning
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-zinc-200 hover:bg-white/20"
                    }`}
                  >
                    {isTimerRunning ? "Pausar" : "Iniciar Cuenta"}
                  </button>
                  {timerRemaining !== null && (
                    <button
                      onClick={() => {
                        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                        setIsTimerRunning(false);
                        setTimerRemaining(currentLesson.timerSeconds!);
                      }}
                      className="p-2 rounded-xl bg-white/10 text-zinc-400 hover:text-white"
                      title="Reiniciar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Paso a Paso: Instrucciones de Ejercicio */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0A84FF]" />
                Instrucciones de Práctica:
              </h3>
              <div className="space-y-2.5">
                {currentLesson.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-zinc-200 leading-relaxed"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Consejos Cruciales: "Remember" de Steve Glazer */}
            {currentLesson.tips.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Reglas de Oro del Profesor (Remember):
                </div>
                <ul className="space-y-1.5 text-xs text-amber-100/90 list-disc list-inside">
                  {currentLesson.tips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
