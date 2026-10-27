"use client";

import React, { useState, useEffect, useRef } from "react";
import { PitchData, midiToNoteName, vocalSynth } from "@/lib/vocalEngine";
import { Play, Square, ChevronUp, ChevronDown, Repeat, Music2, CheckCircle2, Sparkles } from "lucide-react";

interface WarmupStudioViewProps {
  currentPitch: PitchData | null;
  isListening: boolean;
  onToggleMic: () => void;
}

interface ExercisePattern {
  id: string;
  name: string;
  subtitle: string;
  vowelHint: string;
  coachingTip: string;
  intervals: number[]; // Semitonos relativos a la raíz
}

const EXERCISES: ExercisePattern[] = [
  {
    id: "five-tone",
    name: "Escala de 5 Notas (Do-Re-Mi-Fa-Sol)",
    subtitle: "Calentamiento base y resonancia frontal",
    vowelHint: "Con 'Ma - Me - Mi - Mo - Mu' o Lip Trill (Brrr)",
    coachingTip: "Mantén la mandíbula suelta y el mismo espacio interno al subir al 5to grado.",
    intervals: [0, 2, 4, 5, 7, 5, 4, 2, 0],
  },
  {
    id: "major-triad",
    name: "Arpegio de Tríada Mayor (1 - 3 - 5 - 3 - 1)",
    subtitle: "Precisión de intervalos y afinación de saltos",
    vowelHint: "Con 'Na - Ne - Ni' o 'Vvv' para activar apoyo",
    coachingTip: "Piensa las notas agudas hacia abajo (mayor apoyo abdominal) para no apretar el cuello.",
    intervals: [0, 4, 7, 4, 0],
  },
  {
    id: "octave-siren",
    name: "Salto de Octava y Descenso (Puente / Passaggio)",
    subtitle: "Conexión de voz de pecho con voz mixta",
    vowelHint: "Con 'Ng - A' o 'Gu - Gu - Gu' (ayuda al cierre cordal)",
    coachingTip: "Al llegar a la octava superior no grites: permite que resuene en la máscara facial.",
    intervals: [0, 4, 7, 12, 7, 4, 0],
  },
];

export default function WarmupStudioView({
  currentPitch,
  isListening,
  onToggleMic,
}: WarmupStudioViewProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExercisePattern>(EXERCISES[0]);
  const [rootMidi, setRootMidi] = useState<number>(48); // C3 (Ideal inicio varón)
  const [bpm, setBpm] = useState<number>(105);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [autoAscend, setAutoAscend] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [hitSteps, setHitSteps] = useState<Record<number, boolean>>({});

  const stepRef = useRef<number>(-1);
  const rootRef = useRef<number>(rootMidi);
  rootRef.current = rootMidi;

  // Evaluar si el usuario afina la nota activa de la escala
  useEffect(() => {
    if (!isPlaying || activeStepIndex < 0 || !currentPitch) return;
    const expectedMidi = rootMidi + selectedExercise.intervals[activeStepIndex];
    if (Math.abs(currentPitch.midiFloat - expectedMidi) <= 0.65) {
      setHitSteps((prev) => ({ ...prev, [activeStepIndex]: true }));
    }
  }, [currentPitch, isPlaying, activeStepIndex, rootMidi, selectedExercise]);

  // Motor del secuenciador de vocalizaciones
  useEffect(() => {
    if (!isPlaying) {
      setActiveStepIndex(-1);
      stepRef.current = -1;
      return;
    }

    const stepDurationMs = (60 / bpm) * 1000;

    const triggerNextStep = () => {
      const nextStep = stepRef.current + 1;

      if (nextStep >= selectedExercise.intervals.length) {
        // Terminó la escala actual
        if (autoAscend) {
          const nextRoot = rootRef.current >= 58 ? 48 : rootRef.current + 1;
          setRootMidi(nextRoot);
          rootRef.current = nextRoot;
        }
        setHitSteps({});
        stepRef.current = 0;
      } else {
        stepRef.current = nextStep;
      }

      const currentIdx = stepRef.current;
      setActiveStepIndex(currentIdx);

      const noteMidi = rootRef.current + selectedExercise.intervals[currentIdx];
      vocalSynth.playNote(noteMidi, (stepDurationMs / 1000) * 0.92, 0.32);
    };

    triggerNextStep();
    const interval = setInterval(triggerNextStep, stepDurationMs);

    return () => clearInterval(interval);
  }, [isPlaying, bpm, selectedExercise, autoAscend]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Selector de Ejercicios de Vocalización */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="apple-glass rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Music2 className="w-4 h-4 text-[#BF5AF2]" />
            Rutinas de Calentamiento
          </h2>

          <div className="flex flex-col gap-3">
            {EXERCISES.map((ex) => {
              const active = selectedExercise.id === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedExercise(ex);
                    setHitSteps({});
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    active
                      ? "bg-[#BF5AF2]/20 border-[#BF5AF2] shadow-[0_0_25px_rgba(191,90,242,0.25)]"
                      : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="text-sm font-semibold text-white">{ex.name}</div>
                  <div className="text-xs text-zinc-400 mt-1">{ex.subtitle}</div>
                  <div className="mt-2.5 inline-block px-2.5 py-1 rounded-lg bg-black/40 text-[11px] text-[#BF5AF2] font-medium">
                    {ex.vowelHint}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tip del Coach Vocal */}
        <div className="apple-glass rounded-3xl p-5 sm:p-6 border-l-4 border-l-[#0A84FF]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0A84FF] mb-1.5">
            <Sparkles className="w-4 h-4" />
            Indicaciones Técnicas de Clase
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{selectedExercise.coachingTip}</p>
        </div>
      </div>

      {/* Consola Interactiva de Escalas */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="apple-glass rounded-3xl p-5 sm:p-7 flex flex-col justify-between gap-6">
          {/* Controles Superiores */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-zinc-400">Tonalidad Base Actual</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold text-white">{midiToNoteName(rootMidi)}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-zinc-300">
                  Rango del ejercicio: {midiToNoteName(rootMidi)} →{" "}
                  {midiToNoteName(rootMidi + Math.max(...selectedExercise.intervals))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRootMidi((r) => Math.max(40, r - 1))}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" /> -1 Semitono
              </button>
              <button
                onClick={() => setRootMidi((r) => Math.min(64, r + 1))}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" /> +1 Semitono
              </button>
            </div>
          </div>

          {/* Visualizador de Peldaños de la Escala */}
          <div className="my-4">
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-2 sm:gap-2.5 items-end min-h-[190px] pt-6 px-1 sm:px-2">
              {selectedExercise.intervals.map((interval, idx) => {
                const noteMidi = rootMidi + interval;
                const isCurrentStep = activeStepIndex === idx;
                const wasHit = hitSteps[idx];
                const heightPercent = 35 + (interval / 12) * 65;

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    {wasHit && <CheckCircle2 className="w-4 h-4 text-[#30D158] animate-bounce" />}
                    <button
                      onClick={() => vocalSynth.playNote(noteMidi, 0.7, 0.3)}
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full min-h-[54px] rounded-2xl flex flex-col items-center justify-center p-1 sm:p-2 transition-all border cursor-pointer ${
                        isCurrentStep
                          ? "bg-[#0A84FF] text-white border-white shadow-[0_0_25px_rgba(10,132,255,0.6)] scale-105"
                          : wasHit
                          ? "bg-[#30D158]/25 text-[#30D158] border-[#30D158]/50"
                          : "bg-white/[0.06] text-zinc-300 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-bold">{midiToNoteName(noteMidi)}</span>
                      <span className="text-[9px] sm:text-[10px] opacity-75">+{interval}st</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra Inferior de Transporte (Play, BPM, Auto-Subir) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (!isListening) onToggleMic();
                  setIsPlaying(!isPlaying);
                }}
                className={`px-5 sm:px-6 py-3.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                  isPlaying
                    ? "bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.4)]"
                    : "bg-[#30D158] text-black shadow-[0_0_25px_rgba(48,209,88,0.4)] hover:brightness-110"
                }`}
              >
                {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isPlaying ? "Detener Vocalización" : "Iniciar Escala Guiada"}
              </button>

              <button
                onClick={() => setAutoAscend(!autoAscend)}
                className={`px-3.5 sm:px-4 py-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border transition cursor-pointer ${
                  autoAscend
                    ? "bg-[#BF5AF2]/20 text-[#BF5AF2] border-[#BF5AF2]/50"
                    : "bg-white/5 text-zinc-400 border-white/10"
                }`}
              >
                <Repeat className="w-4 h-4" />
                Auto-subir: {autoAscend ? "SÍ" : "NO"}
              </button>
            </div>

            {/* Control de Velocidad BPM */}
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs text-zinc-400 font-medium">Velocidad:</span>
              <input
                type="range"
                min={60}
                max={160}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="accent-[#0A84FF] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-white w-14 text-right">{bpm} BPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
