"use client";

import React, { useEffect, useRef, useState } from "react";
import { PitchData, midiToNoteName, vocalSynth } from "@/lib/vocalEngine";
import { Mic, MicOff, Target, Sparkles, Volume2, Award, RotateCcw } from "lucide-react";

interface PitchMonitorViewProps {
  isListening: boolean;
  onToggleMic: () => void;
  currentPitch: PitchData | null;
  pitchHistory: Array<{ midiFloat: number; clarity: number; timestamp: number }>;
}

const REFERENCE_NOTES = [
  { midi: 48, label: "C3" },
  { midi: 50, label: "D3" },
  { midi: 52, label: "E3" },
  { midi: 53, label: "F3" },
  { midi: 55, label: "G3" },
  { midi: 57, label: "A3" },
  { midi: 59, label: "B3" },
  { midi: 60, label: "C4" },
  { midi: 62, label: "D4" },
  { midi: 64, label: "E4" },
  { midi: 65, label: "F4" },
  { midi: 67, label: "G4" },
];

export default function PitchMonitorView({
  isListening,
  onToggleMic,
  currentPitch,
  pitchHistory,
}: PitchMonitorViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [targetMidi, setTargetMidi] = useState<number | null>(52); // E3 por defecto (ideal voz masculina/media)
  const [isPlayingDrone, setIsPlayingDrone] = useState<boolean>(false);
  const [sustainScore, setSustainScore] = useState<number>(0); // 0 a 100% (meta 5 segundos)
  const [bestSustainStreak, setBestSustainStreak] = useState<number>(0);

  // Evaluar precisión y reto de estabilidad (Sustain)
  useEffect(() => {
    if (!isListening || !currentPitch || currentPitch.clarity < 0.7) return;

    const isMatchingTarget = targetMidi
      ? currentPitch.midi === targetMidi && Math.abs(currentPitch.cents) <= 15
      : Math.abs(currentPitch.cents) <= 15;

    if (isMatchingTarget) {
      setSustainScore((prev) => {
        const next = Math.min(100, prev + 1.4);
        if (next > bestSustainStreak) setBestSustainStreak(Math.round(next));
        return next;
      });
    } else {
      setSustainScore((prev) => Math.max(0, prev - 0.8));
    }
  }, [currentPitch, isListening, targetMidi, bestSustainStreak]);

  // Manejar nota pedal (Drone) de referencia
  const handleSelectTarget = (midi: number) => {
    if (targetMidi === midi && isPlayingDrone) {
      vocalSynth.stopSustainedNote(midi);
      setIsPlayingDrone(false);
    } else {
      vocalSynth.stopAll();
      setTargetMidi(midi);
      vocalSynth.playNote(midi, 1.2, 0.3);
      setIsPlayingDrone(false);
    }
  };

  const toggleDrone = () => {
    if (!targetMidi) return;
    if (isPlayingDrone) {
      vocalSynth.stopSustainedNote(targetMidi);
      setIsPlayingDrone(false);
    } else {
      vocalSynth.startSustainedNote(targetMidi, 0.18);
      setIsPlayingDrone(true);
    }
  };

  useEffect(() => {
    return () => vocalSynth.stopAll();
  }, []);

  // Renderizado del Canvas Piano Roll a 60 FPS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Fondo oscuro translúcido
      ctx.clearRect(0, 0, width, height);

      // Rango de visualización MIDI: de C2 (45) a A4 (69) o centrado en targetMidi
      const centerMidi = targetMidi || (currentPitch ? currentPitch.midi : 55);
      const minMidi = centerMidi - 7;
      const maxMidi = centerMidi + 7;
      const midiRange = maxMidi - minMidi;

      // Dibujar carriles horizontales de notas
      for (let m = minMidi; m <= maxMidi; m++) {
        const y = height - ((m - minMidi) / midiRange) * height;
        const isTarget = m === targetMidi;

        if (isTarget) {
          ctx.fillStyle = "rgba(48, 209, 88, 0.11)";
          const laneHeight = height / midiRange;
          ctx.fillRect(0, y - laneHeight / 2, width, laneHeight);
        }

        ctx.beginPath();
        ctx.strokeStyle = isTarget ? "rgba(48, 209, 88, 0.45)" : "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = isTarget ? 1.5 : 1;
        ctx.moveTo(48, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Etiqueta de la nota a la izquierda
        ctx.fillStyle = isTarget ? "#30D158" : "rgba(235, 235, 245, 0.4)";
        ctx.font = isTarget ? "600 11px -apple-system, sans-serif" : "400 10px -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(midiToNoteName(m), 12, y);
      }

      // Dibujar curva de voz histórica (últimos 5 segundos)
      const now = performance.now();
      const timeWindow = 5000;

      if (pitchHistory.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 1; i < pitchHistory.length; i++) {
          const prev = pitchHistory[i - 1];
          const curr = pitchHistory[i];

          // Cortar línea si hubo una pausa larga entre muestras
          if (curr.timestamp - prev.timestamp > 180) continue;

          const x1 = 55 + ((timeWindow - (now - prev.timestamp)) / timeWindow) * (width - 75);
          const x2 = 55 + ((timeWindow - (now - curr.timestamp)) / timeWindow) * (width - 75);

          if (x2 < 55) continue;

          const y1 = height - ((prev.midiFloat - minMidi) / midiRange) * height;
          const y2 = height - ((curr.midiFloat - minMidi) / midiRange) * height;

          const deviation = Math.abs(curr.midiFloat - Math.round(curr.midiFloat)) * 100;
          const isOnTarget = targetMidi
            ? Math.abs(curr.midiFloat - targetMidi) < 0.2
            : deviation <= 15;

          ctx.beginPath();
          ctx.strokeStyle = isOnTarget ? "#30D158" : deviation <= 28 ? "#FFD60A" : "#0A84FF";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = isOnTarget ? "rgba(48, 209, 88, 0.6)" : "rgba(10, 132, 255, 0.5)";
          ctx.shadowBlur = 10;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      // Dibujar cabeza lectora actual (Orbe brillante)
      if (currentPitch && currentPitch.clarity > 0.65) {
        const currentY = height - ((currentPitch.midiFloat - minMidi) / midiRange) * height;
        const headX = width - 20;
        const isInTune = Math.abs(currentPitch.cents) <= 15;

        ctx.beginPath();
        ctx.arc(headX, currentY, 7, 0, Math.PI * 2);
        ctx.fillStyle = isInTune ? "#30D158" : "#0A84FF";
        ctx.shadowColor = isInTune ? "#30D158" : "#0A84FF";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [pitchHistory, currentPitch, targetMidi]);

  const cents = currentPitch ? currentPitch.cents : 0;
  const isInTune = currentPitch && Math.abs(cents) <= 14;
  const isClose = currentPitch && Math.abs(cents) > 14 && Math.abs(cents) <= 28;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Afinador Circular Apple + Medidor de Estabilidad */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="apple-glass rounded-3xl p-5 sm:p-7 flex flex-col items-center justify-between relative overflow-hidden">
          {/* Encabezado de tarjeta */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isListening ? "bg-[#30D158] animate-pulse shadow-[0_0_10px_#30D158]" : "bg-zinc-600"
                }`}
              />
              <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                {isListening ? "Motor Neural Activo" : "Micrófono en Espera"}
              </span>
            </div>

            <button
              onClick={onToggleMic}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                  : "bg-[#0A84FF] text-white shadow-[0_0_25px_rgba(10,132,255,0.45)] hover:bg-[#0070E0]"
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {isListening ? "Detener" : "Activar Micrófono"}
            </button>
          </div>

          {/* Medidor horizontal de Cents estilo Logic Pro */}
          <div className="w-full my-3">
            <div className="flex justify-between text-[11px] font-medium text-zinc-500 mb-2 px-2">
              <span>-50c (Bajo / Flat)</span>
              <span className="text-zinc-300 font-semibold">0c Centro</span>
              <span>+50c (Alto / Sharp)</span>
            </div>
            <div className="relative h-3 w-full bg-zinc-900/90 rounded-full border border-white/10 overflow-hidden">
              {/* Zona verde central de tolerancia */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[26%] bg-[#30D158]/20 border-x border-[#30D158]/40" />
              {/* Aguja dinámica */}
              {currentPitch && (
                <div
                  className="absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75"
                  style={{
                    left: `calc(${Math.min(96, Math.max(4, 50 + cents))}% - 5px)`,
                    backgroundColor: isInTune ? "#30D158" : isClose ? "#FFD60A" : "#FF453A",
                    boxShadow: `0 0 12px ${isInTune ? "#30D158" : isClose ? "#FFD60A" : "#FF453A"}`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Nota Gigante SF Pro Display */}
          <div className="my-6 flex flex-col items-center">
            <div
              className={`text-8xl font-bold tracking-tight transition-colors duration-150 ${
                !currentPitch
                  ? "text-zinc-700"
                  : isInTune
                  ? "text-[#30D158] drop-shadow-[0_0_30px_rgba(48,209,88,0.35)]"
                  : isClose
                  ? "text-[#FFD60A]"
                  : "text-white"
              }`}
            >
              {currentPitch ? currentPitch.noteLetter : "—"}
              {currentPitch && (
                <span className="text-4xl font-medium text-zinc-400 ml-1">{currentPitch.octave}</span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-zinc-400 font-mono">
              <span>{currentPitch ? `${currentPitch.frequency} Hz` : "0.0 Hz"}</span>
              <span className="text-zinc-700">•</span>
              <span
                className={
                  !currentPitch
                    ? "text-zinc-500"
                    : isInTune
                    ? "text-[#30D158] font-semibold"
                    : "text-amber-400"
                }
              >
                {currentPitch ? `${cents > 0 ? `+${cents}` : cents} cents` : "Canta una nota"}
              </span>
            </div>
          </div>

          {/* Estado de retroalimentación rápida */}
          <div className="w-full py-3 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-between text-xs">
            <span className="text-zinc-400">Diagnóstico en vivo:</span>
            <span className="font-semibold text-zinc-200">
              {!currentPitch
                ? "Esperando entrada vocal..."
                : isInTune
                ? "Afinación exacta • Mantén el apoyo"
                : cents < -14
                ? "Ligeramente bajo • Sube el velo del paladar"
                : "Ligeramente alto • Relaja garganta y mandíbula"}
            </span>
          </div>
        </div>

        {/* Tarjeta de Reto de Estabilidad (Sustain Challenge) */}
        <div className="apple-glass rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#30D158]/15 text-[#30D158]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Estabilidad de Nota (Sustain)</h3>
                <p className="text-xs text-zinc-400">Mantén la nota afinada (±15c) durante 5 seg</p>
              </div>
            </div>
            <button
              onClick={() => setSustainScore(0)}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 transition cursor-pointer"
              title="Reiniciar medidor"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full bg-zinc-900/90 h-4 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-[#0A84FF] via-[#30D158] to-[#30D158]"
              style={{ width: `${sustainScore}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-zinc-400">
            <span>Estabilidad actual: <strong className="text-white">{Math.round(sustainScore)}%</strong></span>
            <span>Récord de sesión: <strong className="text-[#30D158]">{bestSustainStreak}%</strong></span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Piano Roll en Vivo 60FPS + Teclado Guía */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <div className="apple-glass rounded-3xl p-5 sm:p-6 flex flex-col flex-1 min-h-[360px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                Curva de Afinación en Tiempo Real (60 FPS)
              </h2>
              <p className="text-xs text-zinc-400">
                La franja verde indica tu nota objetivo ({targetMidi ? midiToNoteName(targetMidi) : "Libre"})
              </p>
            </div>

            {targetMidi && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleDrone}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    isPlayingDrone
                      ? "bg-[#30D158] text-black font-semibold shadow-[0_0_20px_rgba(48,209,88,0.5)]"
                      : "bg-white/10 text-zinc-200 hover:bg-white/15"
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isPlayingDrone ? "Sonando Guía Continua" : "Sostener Sonido Guía"}
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 w-full rounded-2xl bg-black/55 border border-white/10 overflow-hidden min-h-[260px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Selector de Nota Guía (Teclado de Referencia Rápida) */}
        <div className="apple-glass rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#30D158]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Teclado de Referencia Vocal (Toca para escuchar y fijar meta)
              </span>
            </div>
            <button
              onClick={() => {
                vocalSynth.stopAll();
                setIsPlayingDrone(false);
                setTargetMidi(null);
              }}
              className="text-xs text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Modo Libre
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
            {REFERENCE_NOTES.map((note) => {
              const isSelected = targetMidi === note.midi;
              const isUserSingingThis = currentPitch?.midi === note.midi;
              return (
                <button
                  key={note.midi}
                  onClick={() => handleSelectTarget(note.midi)}
                  className={`py-3.5 rounded-2xl font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-[#30D158] text-black border-[#30D158] shadow-[0_0_20px_rgba(48,209,88,0.4)] scale-105"
                      : isUserSingingThis
                      ? "bg-[#0A84FF]/30 text-white border-[#0A84FF]"
                      : "bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10 active:scale-95"
                  }`}
                >
                  <span>{note.label}</span>
                  <span className="text-[9px] opacity-70">{Math.round(440 * Math.pow(2, (note.midi - 69) / 12))}Hz</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
