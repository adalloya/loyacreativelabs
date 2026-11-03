"use client";

// src/components/studio/VocalPitchCanvas.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { midiToNoteInfo, grandPiano } from '../../audio/grandPianoEngine';
import { Rewind, FastForward, Radio, ZoomIn, ZoomOut, Volume2 } from 'lucide-react';

export interface PitchSample {
  timestamp: number;      // ms desde el inicio de la sesión
  freq: number | null;    // Hz detectados (null = silencio)
  midiFloat: number | null; // Ej: 60.15 (Do4 + 15 cents)
  centsOff: number;       // Desviación respecto a la nota más cercana o nota objetivo
  rms: number;            // Volumen de la voz (0.0 a 1.0)
}

export interface TargetNoteBlock {
  id: string;
  midi: number;           // Nota objetivo (ej. 50 = Re3)
  startTimeMs: number;    // Inicio en el timeline
  durationMs: number;     // Duración del bloque
  label?: string;         // Fonética o sílaba: "Brrrr", "Ma", "Me quieren..."
}

export interface LyricCue {
  id: string;
  startTimeMs: number;
  endTimeMs: number;
  text: string;
  chord?: string;         // Ej: "Em"
  targetNote?: string;    // Ej: "Mi3"
  vocalTip?: string;      // Ej: "Voz de pecho hablada y relajada"
  registerBadge?: string; // Ej: "Voz de Pecho" | "Apoyo Diafragmático"
}

export interface VocalProfile {
  lowestMidi: number;     // La2 (A2) = 45
  passaggioMidi: number;  // Re4 (D4) = 62
  highestMidi: number;    // Mi4 (E4) = 64
}

export interface VocalPitchCanvasProps {
  samplesBuffer: PitchSample[];
  comparisonSamples?: PitchSample[]; // Curva fantasma para Bitácora A/B
  targetBlocks?: TargetNoteBlock[];
  activeLyricCue?: LyricCue | null;
  nextLyricCue?: LyricCue | null;
  vocalProfile?: VocalProfile;
  sessionElapsedMs: number;
  activePhoneticTip?: string;
}

export const VocalPitchCanvas: React.FC<VocalPitchCanvasProps> = ({
  samplesBuffer,
  comparisonSamples = [],
  targetBlocks = [],
  activeLyricCue = null,
  nextLyricCue = null,
  vocalProfile = { lowestMidi: 45, passaggioMidi: 62, highestMidi: 64 }, // La2 - Re4 - Mi4
  sessionElapsedMs,
  activePhoneticTip,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estado de navegación temporal (Live vs Rewind Scrubber)
  const [isLive, setIsLive] = useState<boolean>(true);
  const [scrubTimeMs, setScrubTimeMs] = useState<number>(0);
  const [visibleWindowMs, setVisibleWindowMs] = useState<number>(10000); // 10 segundos visibles en eje X

  // Rango vertical visible de notas MIDI (Default: C2 [36] a G4 [67], ajustable con zoom)
  const [minMidi, setMinMidi] = useState<number>(40); // Mi2 (E2)
  const [maxMidi, setMaxMidi] = useState<number>(69); // La4 (A4)

  // Punto inspeccionado con el cursor cuando se hace Rewind
  const [hoveredSample, setHoveredSample] = useState<PitchSample | null>(null);

  const currentPlayheadMs = isLive ? sessionElapsedMs : scrubTimeMs;
  const latestSample = samplesBuffer.length > 0 ? samplesBuffer[samplesBuffer.length - 1] : null;
  const displayedSample = hoveredSample || (isLive ? latestSample : null);

  // Sincronizar scrubber cuando está en vivo
  useEffect(() => {
    if (isLive) {
      setScrubTimeMs(sessionElapsedMs);
    }
  }, [isLive, sessionElapsedMs]);

  // Manejo de rueda del mouse: Shift + Rueda = Zoom Vertical, Rueda sola = Rebobinar en el tiempo
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.shiftKey) {
      const delta = e.deltaY > 0 ? 1 : -1;
      setMinMidi((prev) => Math.max(33, prev - delta));
      setMaxMidi((prev) => Math.min(84, prev + delta));
    } else {
      setIsLive(false);
      setScrubTimeMs((prev) => {
        const next = Math.max(0, Math.min(sessionElapsedMs, prev - e.deltaY * 12));
        if (next >= sessionElapsedMs - 150) setIsLive(true);
        return next;
      });
    }
  }, [sessionElapsedMs]);

  // Loop de renderizado a 60 FPS en Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

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
      const leftAxisWidth = 68;
      const graphWidth = width - leftAxisWidth;
      const midiRange = maxMidi - minMidi;
      const rowHeight = height / midiRange;

      // Helpers de coordenadas
      const midiToY = (midi: number) => height - ((midi - minMidi) / midiRange) * height;
      // El cabezal actual se ubica al 78% del ancho para dejar margen visual a notas futuras
      const playheadX = leftAxisWidth + graphWidth * 0.78;
      const timeToX = (timeMs: number) => {
        const deltaMs = timeMs - currentPlayheadMs;
        return playheadX + (deltaMs / visibleWindowMs) * (graphWidth * 0.78);
      };

      // 1. FONDO BASE DEL ESTUDIO
      ctx.fillStyle = '#090A0F';
      ctx.fillRect(0, 0, width, height);

      // 2. BANDAS DE REGISTRO VOCAL (Pecho, Passaggio Re4, Mixta/Cabeza)
      const yPassaggioTop = midiToY(vocalProfile.passaggioMidi + 1.5);
      const yPassaggioBottom = midiToY(vocalProfile.passaggioMidi - 0.5);
      const yLowest = midiToY(vocalProfile.lowestMidi - 0.5);

      // Zona Voz Mixta / Cabeza (Arriba del Passaggio)
      const headGrad = ctx.createLinearGradient(0, 0, 0, yPassaggioTop);
      headGrad.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
      headGrad.addColorStop(1, 'rgba(139, 92, 246, 0.04)');
      ctx.fillStyle = headGrad;
      ctx.fillRect(leftAxisWidth, 0, graphWidth, Math.max(0, yPassaggioTop));

      // Zona Puente / Passaggio (Re4 / D4)
      ctx.fillStyle = 'rgba(168, 85, 247, 0.13)';
      ctx.fillRect(leftAxisWidth, yPassaggioTop, graphWidth, yPassaggioBottom - yPassaggioTop);

      // Zona Voz de Pecho (Desde La2 hasta Re4)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
      ctx.fillRect(leftAxisWidth, yPassaggioBottom, graphWidth, Math.max(0, yLowest - yPassaggioBottom));

      // 3. CUADRÍCULA CROMÁTICA HORIZONTAL Y ETIQUETAS DE REGISTRO
      for (let m = minMidi; m <= maxMidi; m++) {
        const y = midiToY(m);
        const info = midiToNoteInfo(m);

        // Fondo alternado para sostenidos (estilo Piano Roll de Melodyne/Logic)
        ctx.fillStyle = info.isSharp ? 'rgba(255, 255, 255, 0.012)' : 'rgba(255, 255, 255, 0.028)';
        ctx.fillRect(leftAxisWidth, y - rowHeight / 2, graphWidth, rowHeight);

        // Línea divisoria de semitono
        ctx.strokeStyle = info.scientific.startsWith('C') && !info.isSharp
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(leftAxisWidth, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Etiquetas de Zonas de Registro a la derecha del lienzo
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(192, 132, 252, 0.75)';
      ctx.fillText('PUENTE (PASSAGGIO • RE4) — CAMBIAR A MIXTA', width - 16, yPassaggioTop + 14);
      ctx.fillStyle = 'rgba(96, 165, 250, 0.55)';
      ctx.fillText('REGISTRO DE PECHO (LA2 - DO#4)', width - 16, yPassaggioBottom + 16);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.fillText('VOZ MIXTA / CABEZA (> MI4)', width - 16, yPassaggioTop - 8);

      // 4. BLOQUES DE NOTAS OBJETIVO (EJERCICIOS DE VOCALIZACIÓN O MELODÍA KARAOKE)
      targetBlocks.forEach((block) => {
        const xStart = timeToX(block.startTimeMs);
        const xEnd = timeToX(block.startTimeMs + block.durationMs);
        if (xEnd < leftAxisWidth || xStart > width) return;

        const yCenter = midiToY(block.midi);
        const blockH = Math.max(14, rowHeight * 0.78);
        const isCurrentTarget =
          currentPlayheadMs >= block.startTimeMs &&
          currentPlayheadMs <= block.startTimeMs + block.durationMs;

        ctx.fillStyle = isCurrentTarget
          ? 'rgba(59, 130, 246, 0.35)'
          : 'rgba(59, 130, 246, 0.16)';
        ctx.strokeStyle = isCurrentTarget ? '#60A5FA' : 'rgba(96, 165, 250, 0.45)';
        ctx.lineWidth = isCurrentTarget ? 2 : 1;

        ctx.beginPath();
        ctx.roundRect(
          Math.max(leftAxisWidth, xStart),
          yCenter - blockH / 2,
          Math.max(8, xEnd - Math.max(leftAxisWidth, xStart)),
          blockH,
          6
        );
        ctx.fill();
        ctx.stroke();

        const noteInfo = midiToNoteInfo(block.midi);
        ctx.fillStyle = '#E2E8F0';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `${noteInfo.solfege} (${noteInfo.scientific}) ${block.label ? `• ${block.label}` : ''}`,
          Math.max(leftAxisWidth + 6, xStart + 8),
          yCenter + 4
        );
      });

      // 5. CURVA FANTASMA DE COMPARACIÓN A/B (SI HAY UNA TOMA SELECCIONADA EN BITÁCORA)
      if (comparisonSamples.length > 1) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        let drawingGhost = false;
        for (const s of comparisonSamples) {
          if (s.midiFloat === null) {
            drawingGhost = false;
            continue;
          }
          const x = timeToX(s.timestamp);
          if (x < leftAxisWidth || x > width) continue;
          const y = midiToY(s.midiFloat);
          if (!drawingGhost) {
            ctx.moveTo(x, y);
            drawingGhost = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 6. CURVA DE TONO VOCAL EN TIEMPO REAL / HISTORIAL (COLOR DINÁMICO POR AFINACIÓN)
      const minVisibleTime = currentPlayheadMs - visibleWindowMs;
      const maxVisibleTime = currentPlayheadMs + visibleWindowMs * 0.3;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 1; i < samplesBuffer.length; i++) {
        const prev = samplesBuffer[i - 1];
        const curr = samplesBuffer[i];

        if (
          curr.timestamp < minVisibleTime ||
          prev.timestamp > maxVisibleTime ||
          prev.midiFloat === null ||
          curr.midiFloat === null ||
          curr.timestamp - prev.timestamp > 180 // Cortar trazo si hubo silencio entre frases
        ) {
          continue;
        }

        const x1 = timeToX(prev.timestamp);
        const y1 = midiToY(prev.midiFloat);
        const x2 = timeToX(curr.timestamp);
        const y2 = midiToY(curr.midiFloat);

        if (x2 < leftAxisWidth) continue;

        const absCents = Math.abs(curr.centsOff);
        let strokeColor = '#10B981'; // Verde Esmeralda: Afinado (±15 cents)
        if (absCents > 35) {
          strokeColor = '#EF4444';   // Rojo Coral: Desafinado (>35 cents)
        } else if (absCents > 15) {
          strokeColor = '#F59E0B';   // Ámbar: Ligeramente alto/bajo (16-35 cents)
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(2.5, Math.min(6, 2.5 + curr.rms * 4));
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // 7. CABEZAL DE LECTURA (PLAYHEAD) Y NODO DE VOZ ACTIVA
      ctx.strokeStyle = isLive ? 'rgba(59, 130, 246, 0.75)' : 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      if (displayedSample && displayedSample.midiFloat !== null) {
        const activeY = midiToY(displayedSample.midiFloat);
        const absCents = Math.abs(displayedSample.centsOff);
        const dotColor = absCents <= 15 ? '#10B981' : absCents <= 35 ? '#F59E0B' : '#EF4444';

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(playheadX, activeY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 8. COLUMNA IZQUIERDA DE NOTAS (EJE VERTICAL INTERACTIVO CON AUDIO DE REFERENCIA)
      ctx.fillStyle = '#11131A';
      ctx.fillRect(0, 0, leftAxisWidth, height);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(leftAxisWidth, 0);
      ctx.lineTo(leftAxisWidth, height);
      ctx.stroke();

      for (let m = minMidi; m <= maxMidi; m++) {
        const y = midiToY(m);
        const info = midiToNoteInfo(m);
        const isUserLandmark =
          m === vocalProfile.lowestMidi ||
          m === vocalProfile.passaggioMidi ||
          m === vocalProfile.highestMidi;

        if (isUserLandmark) {
          ctx.fillStyle = m === vocalProfile.passaggioMidi ? 'rgba(168, 85, 247, 0.28)' : 'rgba(59, 130, 246, 0.25)';
          ctx.fillRect(0, y - rowHeight / 2, leftAxisWidth, rowHeight);
        }

        ctx.fillStyle = isUserLandmark
          ? '#F8FAFC'
          : info.isSharp
          ? '#64748B'
          : '#CBD5E1';
        ctx.font = isUserLandmark ? '700 11px "JetBrains Mono", monospace' : '500 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${info.solfege}`, 8, y + 3.5);
        ctx.fillStyle = '#64748B';
        ctx.fillText(`${info.scientific}`, 42, y + 3.5);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    samplesBuffer,
    comparisonSamples,
    targetBlocks,
    minMidi,
    maxMidi,
    currentPlayheadMs,
    visibleWindowMs,
    isLive,
    vocalProfile,
    displayedSample,
  ]);

  // Tocar nota en el Grand Piano al hacer clic en el eje vertical izquierdo
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (clickX <= 68) {
      const midiRange = maxMidi - minMidi;
      const clickedMidi = Math.round(maxMidi - (clickY / rect.height) * midiRange);
      grandPiano.playNote(clickedMidi, 0.9);
    }
  };

  // Inspeccionar punto exacto en modo Rewind al mover el mouse
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLive || samplesBuffer.length === 0) {
      if (hoveredSample) setHoveredSample(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const leftAxisWidth = 68;
    if (mouseX <= leftAxisWidth) return;

    const graphWidth = rect.width - leftAxisWidth;
    const playheadX = leftAxisWidth + graphWidth * 0.78;
    const targetTimeMs = currentPlayheadMs + ((mouseX - playheadX) / (graphWidth * 0.78)) * visibleWindowMs;

    // Buscar la muestra más cercana a ese milisegundo
    let closest: PitchSample | null = null;
    let minDiff = Infinity;
    for (const s of samplesBuffer) {
      const diff = Math.abs(s.timestamp - targetTimeMs);
      if (diff < minDiff && diff < 250) {
        minDiff = diff;
        closest = s;
      }
    }
    setHoveredSample(closest);
  };

  const activeNoteInfo =
    displayedSample && displayedSample.midiFloat !== null
      ? midiToNoteInfo(Math.round(displayedSample.midiFloat))
      : null;

  return (
    <div className="relative flex-1 flex flex-col bg-[#090A0F] overflow-hidden select-none">
      {/* 1. HUD SUPERIOR DE PRECISIÓN EN VIVO (NOTA, HZ, CENTS Y FONÉTICA) */}
      <div className="absolute top-3 left-20 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 bg-[#11131A]/90 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl pointer-events-auto shadow-lg">
          <div className="flex items-baseline gap-2 min-w-[115px]">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {activeNoteInfo ? activeNoteInfo.solfege : '—'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {activeNoteInfo ? `${activeNoteInfo.scientific} • ${displayedSample?.freq?.toFixed(1)} Hz` : 'Esperando voz'}
            </span>
          </div>

          {/* Medidor lineal de desviación en Cents (-50c a +50c) */}
          <div className="flex flex-col w-44">
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
              <span>-50c</span>
              <span
                className={
                  activeNoteInfo
                    ? Math.abs(displayedSample!.centsOff) <= 15
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-400 font-semibold'
                    : 'text-slate-500'
                }
              >
                {activeNoteInfo
                  ? `${displayedSample!.centsOff > 0 ? '+' : ''}${Math.round(displayedSample!.centsOff)} cents`
                  : 'Centro Exacto'}
              </span>
              <span>+50c</span>
            </div>
            <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-400/70 -translate-x-1/2" />
              {activeNoteInfo && (
                <div
                  className={`absolute top-0 bottom-0 w-2.5 rounded-full transition-all duration-75 ${
                    Math.abs(displayedSample!.centsOff) <= 15
                      ? 'bg-emerald-400'
                      : Math.abs(displayedSample!.centsOff) <= 35
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    left: `${Math.max(5, Math.min(95, 50 + displayedSample!.centsOff))}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              )}
            </div>
          </div>

          {activePhoneticTip && (
            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-blue-300 font-mono">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{activePhoneticTip}</span>
            </div>
          )}
        </div>

        {/* Controles de Zoom del Lienzo */}
        <div className="flex items-center gap-1.5 bg-[#11131A]/90 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-xl pointer-events-auto">
          <button
            onClick={() => setVisibleWindowMs((w) => Math.max(4000, w - 2000))}
            className="p-1 text-slate-400 hover:text-white transition"
            title="Acercar línea de tiempo"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1">{visibleWindowMs / 1000}s</span>
          <button
            onClick={() => setVisibleWindowMs((w) => Math.min(30000, w + 2000))}
            className="p-1 text-slate-400 hover:text-white transition"
            title="Alejar línea de tiempo"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CANVAS PRINCIPAL A 60 FPS */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredSample(null)}
        className="w-full flex-1 cursor-crosshair"
      />

      {/* 3. OVERLAY DE TELEPROMPTER & COACHING EN VIVO (CUANDO HAY CANCIÓN / KARAOKE ACTIVO) */}
      {activeLyricCue && (
        <div className="absolute bottom-14 left-24 right-6 z-10 pointer-events-none flex justify-center">
          <div className="w-full max-w-3xl bg-[#0D1017]/85 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3.5 shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Respirar
                </span>
                {activeLyricCue.chord && (
                  <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-white/10 text-white">
                    {activeLyricCue.chord}
                  </span>
                )}
                {activeLyricCue.targetNote && (
                  <button
                    onClick={() => grandPiano.playNote(activeLyricCue.targetNote!, 0.8)}
                    className="px-2.5 py-0.5 text-[11px] font-mono rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition"
                  >
                    🔊 Nota Guía: {activeLyricCue.targetNote}
                  </button>
                )}
              </div>
              {activeLyricCue.registerBadge && (
                <span className="px-2.5 py-0.5 text-[11px] font-mono rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeLyricCue.registerBadge}
                </span>
              )}
            </div>

            <p className="text-xl font-bold text-white tracking-tight">{activeLyricCue.text}</p>
            {activeLyricCue.vocalTip && (
              <p className="text-xs text-slate-300 mt-1">✨ {activeLyricCue.vocalTip}</p>
            )}
            {nextLyricCue && (
              <p className="text-sm text-slate-500 mt-1.5 truncate">Siguiente: {nextLyricCue.text}</p>
            )}
          </div>
        </div>
      )}

      {/* 4. BARRA INFERIOR DE TIME-SCRUBBING (REBOBINAR SESIÓN PARA REVISAR AFINACIÓN) */}
      <div className="h-10 bg-[#11131A] border-t border-white/10 px-4 flex items-center gap-4 z-20">
        <button
          onClick={() => {
            setIsLive(false);
            setScrubTimeMs((t) => Math.max(0, t - 5000));
          }}
          className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
          title="Retroceder 5 segundos"
        >
          <Rewind className="w-3.5 h-3.5" /> -5s
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
            {(currentPlayheadMs / 1000).toFixed(1)}s
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(1000, sessionElapsedMs)}
            value={currentPlayheadMs}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIsLive(val >= sessionElapsedMs - 150);
              setScrubTimeMs(val);
            }}
            className="flex-1 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12">
            {(sessionElapsedMs / 1000).toFixed(1)}s
          </span>
        </div>

        <button
          onClick={() => {
            setScrubTimeMs((t) => {
              const next = Math.min(sessionElapsedMs, t + 5000);
              if (next >= sessionElapsedMs - 150) setIsLive(true);
              return next;
            });
          }}
          className="flex items-center gap-1 text-xs font-mono text-slate-300 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
        >
          +5s <FastForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsLive(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition ${
            isLive
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          {isLive ? 'EN VIVO' : 'VOLVER A VIVO'}
        </button>
      </div>
    </div>
  );
};

export default VocalPitchCanvas;
