"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useVocalSession, PitchHistoryPoint } from "@/store/vocalSessionStore";
import {
  SOLFEGE_NAMES,
  NOTE_NAMES,
  getVocalRegister,
  midiToNoteName,
} from "@/lib/vocalEngine";
import {
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Radio,
  Music,
  Wind,
  Target,
  Sparkles,
} from "lucide-react";

export default function VocalPitchCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    currentPitch,
    isListening,
    pitchHistoryBuffer,
    isLive,
    setIsLive,
    scrubOffsetSeconds,
    setScrubOffsetSeconds,
    zoomSeconds,
    setZoomSeconds,
    vocalProfile,
    activeExercise,
    exerciseTargetBlocks,
    activeSong,
    songTime,
    activeLyricLine,
    nextLyricLine,
    ghostTake,
  } = useVocalSession();

  // Rango cromático vertical (por defecto de C2/36 a C6/84 o centrado en el perfil)
  const minMidi = Math.max(36, vocalProfile.lowestMidi - 6);
  const maxMidi = Math.min(84, vocalProfile.highestMidi + 8);
  const totalMidiLanes = maxMidi - minMidi + 1;

  // 1. Loop de renderizado a 60 FPS en HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      if (width === 0 || height === 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Fondo del estudio DAW
      ctx.fillStyle = "#090A0F";
      ctx.fillRect(0, 0, width, height);

      const laneHeight = height / totalMidiLanes;

      // ==========================================
      // A. DIBUJAR BANDAS DE REGISTRO VOCAL (FONDO)
      // ==========================================
      const passaggioY = height - (vocalProfile.passaggioMidi - minMidi + 1) * laneHeight;

      // 1. Zona de Voz de Pecho (Debajo del Passaggio)
      ctx.fillStyle = "rgba(30, 41, 59, 0.35)";
      ctx.fillRect(0, passaggioY, width, height - passaggioY);

      // 2. Franja de Passaggio (Puente hacia Voz Mixta en Re4 / D4)
      ctx.fillStyle = "rgba(168, 85, 247, 0.16)";
      ctx.fillRect(0, passaggioY - laneHeight * 1.5, width, laneHeight * 2);

      // 3. Zona de Voz de Cabeza / Agudos (Arriba de Passaggio)
      ctx.fillStyle = "rgba(6, 182, 212, 0.08)";
      ctx.fillRect(0, 0, width, passaggioY - laneHeight * 1.5);

      // Línea divisoria del Passaggio
      ctx.strokeStyle = "rgba(168, 85, 247, 0.45)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, passaggioY);
      ctx.lineTo(width, passaggioY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ==========================================
      // B. CUADRÍCULA CROMÁTICA & ETIQUETAS DE NOTAS
      // ==========================================
      for (let m = minMidi; m <= maxMidi; m++) {
        const y = height - (m - minMidi + 1) * laneHeight;
        const noteIndex = ((m % 12) + 12) % 12;
        const isC = noteIndex === 0;
        const isPassaggio = m === vocalProfile.passaggioMidi;
        const isSharp = NOTE_NAMES[noteIndex].includes("#");

        // Línea horizontal
        ctx.strokeStyle = isPassaggio
          ? "rgba(168, 85, 247, 0.3)"
          : isC
          ? "rgba(255, 255, 255, 0.12)"
          : isSharp
          ? "rgba(255, 255, 255, 0.02)"
          : "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = isC ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // Nombres de Notas a la Izquierda y Derecha
        const octave = Math.floor(m / 12) - 1;
        const solf = SOLFEGE_NAMES[noteIndex];
        const anglo = NOTE_NAMES[noteIndex];

        ctx.font = isC || isPassaggio ? "bold 10px monospace" : "9px monospace";
        ctx.fillStyle = isPassaggio
          ? "#D8B4FE"
          : isC
          ? "#FFFFFF"
          : isSharp
          ? "rgba(255, 255, 255, 0.2)"
          : "rgba(255, 255, 255, 0.4)";
        ctx.fillText(`${solf}${octave}`, 8, y + laneHeight * 0.75);
        ctx.fillText(anglo, width - 26, y + laneHeight * 0.75);
      }

      // ==========================================
      // C. TIEMPO & CÁLCULO DEL CABEZAL (PLAYHEAD)
      // ==========================================
      const now = performance.now();
      const visibleTimeWindowMs = zoomSeconds * 1000;
      // En modo Live el cabezal está al 75% del ancho
      const playheadX = isLive ? width * 0.75 : width * 0.5;
      const targetTimeMs = isLive ? now : now - scrubOffsetSeconds * 1000;

      // Línea vertical del Cabezal de Tiempo
      ctx.strokeStyle = isLive ? "#10B981" : "#F59E0B";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // ==========================================
      // D. BLOQUES DE NOTAS OBJETIVO (PIANO ROLL)
      // ==========================================
      if (exerciseTargetBlocks.length > 0 && activeExercise) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.28)";
        ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
        ctx.lineWidth = 1.5;

        const cycleMs = (60 / activeExercise.tempoBpm) * exerciseTargetBlocks.length * 1000;
        const currentCycleOffset = (now % cycleMs) / 1000;

        exerciseTargetBlocks.forEach((block) => {
          if (block.midi < minMidi || block.midi > maxMidi) return;
          const y = height - (block.midi - minMidi + 1) * laneHeight;

          // Calcular posición horizontal respecto al cabezal
          const timeDelta = block.startTime - currentCycleOffset;
          const blockX = playheadX + (timeDelta / zoomSeconds) * width;
          const blockW = (block.duration / zoomSeconds) * width;

          if (blockX + blockW > 0 && blockX < width) {
            ctx.beginPath();
            ctx.roundRect(blockX, y + 2, Math.max(12, blockW - 2), laneHeight - 4, 4);
            ctx.fill();
            ctx.stroke();

            // Etiqueta de la nota objetivo
            ctx.fillStyle = "#93C5FD";
            ctx.font = "bold 9px monospace";
            ctx.fillText(block.noteName.split(" ")[0], blockX + 4, y + laneHeight * 0.7);
          }
        });
      }

      // ==========================================
      // E. TRAZO DE VOZ EN TIEMPO REAL (PITCH TRAIL)
      // ==========================================
      const buffer = pitchHistoryBuffer;
      const startTime = targetTimeMs - (playheadX / width) * visibleTimeWindowMs;
      const endTime = startTime + visibleTimeWindowMs;

      // Filtrar puntos visibles en la ventana actual
      const visiblePoints = buffer.filter((p) => p.timestamp >= startTime && p.timestamp <= endTime);

      if (visiblePoints.length > 1) {
        for (let i = 1; i < visiblePoints.length; i++) {
          const pPrev = visiblePoints[i - 1];
          const pCurr = visiblePoints[i];

          // Si el lapso es mayor a 250ms (silencio/pausa), no conectar la línea
          if (pCurr.timestamp - pPrev.timestamp > 250) continue;

          const x1 = ((pPrev.timestamp - startTime) / visibleTimeWindowMs) * width;
          const y1 = height - (pPrev.midiFloat - minMidi + 0.5) * laneHeight;
          const x2 = ((pCurr.timestamp - startTime) / visibleTimeWindowMs) * width;
          const y2 = height - (pCurr.midiFloat - minMidi + 0.5) * laneHeight;

          // Color según precisión de entonación en cents
          const absCents = Math.abs(pCurr.centsOff);
          let strokeColor = "#10B981"; // Verde esmeralda (afinado < 15c)
          if (absCents > 35) {
            strokeColor = "#EF4444"; // Rojo coral (desafinado)
          } else if (absCents > 15) {
            strokeColor = "#F59E0B"; // Ámbar (ligeramente desviado)
          }

          // Grosor reactivo al volumen RMS
          const lineWidth = Math.max(2.5, Math.min(8, (pCurr.rmsVolume || 0.05) * 55));

          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Punto actual en el cabezal si el usuario está cantando en vivo
      if (isLive && currentPitch && currentPitch.clarity >= 0.65) {
        const liveY = height - (currentPitch.midiFloat - minMidi + 0.5) * laneHeight;
        const absCents = Math.abs(currentPitch.cents);

        const pointColor = absCents <= 15 ? "#10B981" : absCents <= 35 ? "#F59E0B" : "#EF4444";

        // Halo de resonancia
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(playheadX, liveY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(playheadX, liveY, 9, 0, Math.PI * 2);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    pitchHistoryBuffer,
    isLive,
    scrubOffsetSeconds,
    zoomSeconds,
    vocalProfile,
    minMidi,
    maxMidi,
    totalMidiLanes,
    currentPitch,
    exerciseTargetBlocks,
    activeExercise,
  ]);

  // Manejador de redimensionamiento dinámico del canvas a pantalla completa
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scrubbing con arrastre del mouse / touch
  const handleScrubWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    if (isLive) setIsLive(false);
    setScrubOffsetSeconds(Math.max(0, scrubOffsetSeconds + delta * 2));
  };

  const regInfo = currentPitch ? getVocalRegister(currentPitch.midi) : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleScrubWheel}
      className="flex-1 w-full h-full relative overflow-hidden bg-[#090A0F] select-none flex flex-col"
    >
      {/* Canvas Principal */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* ======================================================== */}
      {/* 1. HUD SUPERIOR FLOTANTE DE NOTA EN VIVO & TELEMETRÍA    */}
      {/* ======================================================== */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="bg-[#11131A]/90 backdrop-blur-xl border border-white/15 p-3 sm:p-4 rounded-3xl shadow-2xl flex items-center gap-4 sm:gap-6 pointer-events-auto">
          {/* Nota Principal */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Nota Actual
            </div>
            <div className="flex items-baseline gap-1 mt-0.5 font-mono">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {currentPitch ? currentPitch.noteLetter : "--"}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-zinc-400">
                {currentPitch ? currentPitch.octave : ""}
              </span>
              <span className="text-xs text-zinc-500 ml-1">
                {currentPitch ? `(${currentPitch.angloName})` : ""}
              </span>
            </div>
          </div>

          {/* Frecuencia Exacta y Desviación en Cents */}
          <div className="flex flex-col gap-1 min-w-[110px] sm:min-w-[130px]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-400">
                {currentPitch ? `${currentPitch.frequency} Hz` : "0.0 Hz"}
              </span>
              <span
                className={`font-bold ${
                  !currentPitch
                    ? "text-zinc-600"
                    : Math.abs(currentPitch.cents) <= 15
                    ? "text-emerald-400"
                    : Math.abs(currentPitch.cents) <= 35
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {currentPitch ? `${currentPitch.cents > 0 ? "+" : ""}${currentPitch.cents}c` : "0c"}
              </span>
            </div>

            {/* Medidor Horizontal de Cents (-50c a +50c) */}
            <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2" />
              {currentPitch && (
                <div
                  className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 -translate-x-1/2 ${
                    Math.abs(currentPitch.cents) <= 15
                      ? "bg-emerald-400 shadow-[0_0_8px_#10B981]"
                      : Math.abs(currentPitch.cents) <= 35
                      ? "bg-amber-400 shadow-[0_0_8px_#F59E0B]"
                      : "bg-red-400 shadow-[0_0_8px_#EF4444]"
                  }`}
                  style={{
                    left: `${Math.max(5, Math.min(95, 50 + currentPitch.cents))}%`,
                  }}
                />
              )}
            </div>

            {/* Badge de Registro Vocal */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold border"
                style={{
                  backgroundColor: regInfo ? regInfo.badgeBg : "rgba(255,255,255,0.05)",
                  color: regInfo ? regInfo.textColor : "#71717A",
                  borderColor: regInfo ? regInfo.borderColor : "rgba(255,255,255,0.1)",
                }}
              >
                {regInfo ? regInfo.name : "Silencio"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OVERLAY DE TELEPROMPTER & LETRAS FLOTANTE (KARAOKE)   */}
      {/* ======================================================== */}
      {activeSong && activeLyricLine && (
        <div className="absolute top-4 right-4 max-w-sm sm:max-w-md z-20 pointer-events-none">
          <div className="bg-[#11131A]/90 backdrop-blur-xl border border-white/15 p-4 rounded-3xl shadow-2xl space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400 border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Music size={12} className="text-blue-400" />
                <span className="font-bold text-white truncate max-w-[180px]">
                  {activeSong.title}
                </span>
              </div>
              <span className="text-zinc-500">{activeSong.artist}</span>
            </div>

            {/* Línea Actual Cantando */}
            <div className="text-base sm:text-lg font-bold text-white leading-tight">
              {activeLyricLine.text}
            </div>

            {/* Próxima Línea */}
            {nextLyricLine && (
              <div className="text-xs text-zinc-500 font-medium leading-tight">
                {nextLyricLine.text}
              </div>
            )}

            {/* Sugerencia de respiración / diafragma si existe */}
            {activeLyricLine.vocalCue && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-semibold">
                <Wind size={11} />
                <span>{activeLyricLine.vocalCue}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. BARRA DE REBOBINADO TEMPORAL / SCRUBBER (PIE CANVAS)  */}
      {/* ======================================================== */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#11131A]/95 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-2xl shadow-2xl select-none">
        {/* Botón Ir Atrás 5s */}
        <button
          onClick={() => {
            setIsLive(false);
            setScrubOffsetSeconds(scrubOffsetSeconds + 5);
          }}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Retroceder 5 segundos"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Indicador de Desfase / Estado Live */}
        {isLive ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
            <Radio size={12} className="animate-pulse" />
            <span>VIVO (60 FPS)</span>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsLive(true);
              setScrubOffsetSeconds(0);
            }}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold transition cursor-pointer"
            title="Volver a la señal en tiempo real"
          >
            <span>-{scrubOffsetSeconds}s</span>
            <span className="underline">Volver a Vivo</span>
          </button>
        )}

        {/* Botón Avanzar 5s */}
        <button
          onClick={() => {
            const next = Math.max(0, scrubOffsetSeconds - 5);
            setScrubOffsetSeconds(next);
            if (next === 0) setIsLive(true);
          }}
          disabled={isLive}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
          title="Avanzar 5 segundos"
        >
          <ChevronRight size={16} />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Zoom de Ventana Temporal (8s - 15s - 30s) */}
        <button
          onClick={() => setZoomSeconds(Math.min(30, zoomSeconds + 5))}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Alejar Zoom (Más segundos visibles)"
        >
          <ZoomOut size={15} />
        </button>
        <span className="text-[10px] font-mono text-zinc-400">{zoomSeconds}s</span>
        <button
          onClick={() => setZoomSeconds(Math.max(5, zoomSeconds - 5))}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Acercar Zoom (Menos segundos visibles)"
        >
          <ZoomIn size={15} />
        </button>
      </div>
    </div>
  );
}
