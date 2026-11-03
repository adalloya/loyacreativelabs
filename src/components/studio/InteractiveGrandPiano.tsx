"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVocalSession } from "@/store/vocalSessionStore";
import { grandPiano } from "@/audio/grandPianoEngine";
import { SOLFEGE_NAMES, NOTE_NAMES, midiToNoteName } from "@/lib/vocalEngine";
import { ChevronLeft, ChevronRight, Volume2, Sparkles } from "lucide-react";

// Teclas de piano: C2 (MIDI 36) a C7 (MIDI 84) = 49 teclas (expandible a 88 teclas)
const WHITE_NOTES = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

interface PianoKeyData {
  midi: number;
  noteIndex: number;
  isBlack: boolean;
  octave: number;
  solfege: string;
  anglo: string;
}

function generateKeys(startMidi = 36, endMidi = 84): PianoKeyData[] {
  const keys: PianoKeyData[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    const noteIndex = ((m % 12) + 12) % 12;
    const isBlack = !WHITE_NOTES.includes(noteIndex);
    const octave = Math.floor(m / 12) - 1;
    keys.push({
      midi: m,
      noteIndex,
      isBlack,
      octave,
      solfege: `${SOLFEGE_NAMES[noteIndex]}`,
      anglo: `${NOTE_NAMES[noteIndex]}`,
    });
  }
  return keys;
}

export default function InteractiveGrandPiano() {
  const {
    targetPianoNotes,
    sungPianoMidi,
    currentPitch,
    vocalProfile,
    sustainPedal,
    toggleSustainPedal,
  } = useVocalSession();

  const [activeMidis, setActiveMidis] = useState<Set<number>>(new Set());
  const [octaveOffset, setOctaveOffset] = useState<number>(0); // -1, 0, +1
  const isMouseDownRef = useRef<boolean>(false);
  const pianoContainerRef = useRef<HTMLDivElement | null>(null);

  const startMidi = Math.max(21, 36 + octaveOffset * 12);
  const endMidi = Math.min(108, 84 + octaveOffset * 12);
  const keys = generateKeys(startMidi, endMidi);

  // Notas blancas para calcular proporciones
  const whiteKeys = keys.filter((k) => !k.isBlack);

  const handleKeyTouchDown = (midi: number) => {
    grandPiano.triggerAttack(midi, 0.85);
    setActiveMidis((prev) => new Set(prev).add(midi));
  };

  const handleKeyTouchUp = (midi: number) => {
    grandPiano.triggerRelease(midi);
    setActiveMidis((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  };

  const handleMouseEnter = (midi: number) => {
    if (isMouseDownRef.current) {
      handleKeyTouchDown(midi);
    }
  };

  const handleMouseLeave = (midi: number) => {
    if (isMouseDownRef.current) {
      handleKeyTouchUp(midi);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        activeMidis.forEach((midi) => grandPiano.triggerRelease(midi));
        setActiveMidis(new Set());
      }
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [activeMidis]);

  return (
    <div className="h-[165px] bg-[#0C0E14] border-t border-white/[0.08] flex flex-col justify-between shrink-0 select-none relative z-20">
      {/* Barra de Controles del Piano (Arriba del teclado) */}
      <div className="h-7 px-4 flex items-center justify-between border-b border-white/[0.06] bg-[#0F1118] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Objetivo (Azul)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-2" />
            <span>Tu Voz (Verde)</span>
          </div>
        </div>

        {/* Desplazamiento de Octava y Pedal Sustain */}
        <div className="flex items-center gap-2">
          {/* Indicador de notas de Tesitura */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-zinc-500 mr-2">
            <span className="text-blue-400 font-bold">Grave: {midiToNoteName(vocalProfile.lowestMidi, "both").split(" ")[0]}</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">Puente: {midiToNoteName(vocalProfile.passaggioMidi, "both").split(" ")[0]}</span>
            <span>•</span>
            <span className="text-amber-400 font-bold">Agudo: {midiToNoteName(vocalProfile.highestMidi, "both").split(" ")[0]}</span>
          </div>

          <div className="flex items-center bg-black/40 rounded-lg border border-white/10 p-0.5">
            <button
              onClick={() => setOctaveOffset(Math.max(-1, octaveOffset - 1))}
              disabled={octaveOffset <= -1}
              className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Bajar una octava"
            >
              <ChevronLeft size={13} />
            </button>
            <span className="font-mono text-[10px] px-1 text-zinc-300">
              {octaveOffset === 0 ? "Octava Central" : octaveOffset > 0 ? "+1 Octava" : "-1 Octava"}
            </span>
            <button
              onClick={() => setOctaveOffset(Math.min(1, octaveOffset + 1))}
              disabled={octaveOffset >= 1}
              className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Subir una octava"
            >
              <ChevronRight size={13} />
            </button>
          </div>

          <button
            onClick={toggleSustainPedal}
            className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition cursor-pointer ${
              sustainPedal
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                : "bg-white/[0.04] border-white/10 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Sustain {sustainPedal ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Contenedor del Teclado Vectorial / DOM */}
      <div
        ref={pianoContainerRef}
        onMouseDown={() => (isMouseDownRef.current = true)}
        className="flex-1 w-full relative flex overflow-hidden px-1 pb-1"
      >
        {/* Renderizado de Teclas Blancas */}
        <div className="w-full h-full flex">
          {whiteKeys.map((key) => {
            const isManualPressed = activeMidis.has(key.midi);
            const isTarget = targetPianoNotes.has(key.midi);
            const isSung = sungPianoMidi === key.midi;

            // Marcadores de tesitura
            const isLowest = key.midi === vocalProfile.lowestMidi;
            const isPassaggio = key.midi === vocalProfile.passaggioMidi;
            const isHighest = key.midi === vocalProfile.highestMidi;

            let bgColor = "bg-gradient-to-b from-white via-zinc-100 to-zinc-200 text-zinc-700";
            if (isTarget && isSung) {
              bgColor = "bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-500 text-black shadow-[0_0_15px_#10B981]";
            } else if (isSung) {
              const cents = currentPitch?.cents || 0;
              bgColor =
                Math.abs(cents) <= 15
                  ? "bg-gradient-to-b from-emerald-400 to-emerald-500 text-black shadow-[0_0_12px_#10B981]"
                  : "bg-gradient-to-b from-amber-400 to-amber-500 text-black shadow-[0_0_12px_#F59E0B]";
            } else if (isTarget) {
              bgColor = "bg-gradient-to-b from-blue-400 via-blue-500 to-indigo-600 text-white shadow-[0_0_15px_#3B82F6]";
            } else if (isManualPressed) {
              bgColor = "bg-zinc-300 text-black";
            }

            return (
              <div
                key={key.midi}
                onMouseDown={() => handleKeyTouchDown(key.midi)}
                onMouseUp={() => handleKeyTouchUp(key.midi)}
                onMouseEnter={() => handleMouseEnter(key.midi)}
                onMouseLeave={() => handleMouseLeave(key.midi)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleKeyTouchDown(key.midi);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleKeyTouchUp(key.midi);
                }}
                className={`flex-1 h-full rounded-b-md border border-t-0 border-zinc-400/30 flex flex-col justify-between items-center pb-1.5 transition-all cursor-pointer relative shadow-sm ${bgColor}`}
              >
                {/* Pin indicador de Tesitura en la tecla */}
                <div className="pt-1">
                  {isPassaggio && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 block shadow-[0_0_6px_#A855F7]" title="Passaggio (Re4)" />
                  )}
                  {isLowest && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 block shadow-[0_0_6px_#3B82F6]" title="Límite Grave" />
                  )}
                  {isHighest && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 block shadow-[0_0_6px_#F59E0B]" title="Límite Agudo" />
                  )}
                </div>

                {/* Etiquetas de Notación */}
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-bold text-[10px] tracking-tight">{key.solfege}</span>
                  <span className="text-[9px] font-mono opacity-60">
                    {key.anglo}
                    {key.octave}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Renderizado de Teclas Negras (Posicionamiento Absoluto Superpuesto) */}
        <div className="absolute inset-0 pointer-events-none px-1">
          {keys.map((key) => {
            if (!key.isBlack) return null;

            // Calcular posición porcentual basada en las teclas blancas
            const prevWhiteCount = keys
              .slice(0, keys.findIndex((k) => k.midi === key.midi))
              .filter((k) => !k.isBlack).length;

            const totalWhite = whiteKeys.length;
            const leftPercent = (prevWhiteCount / totalWhite) * 100 - (100 / totalWhite) * 0.3;
            const widthPercent = (100 / totalWhite) * 0.6;

            const isManualPressed = activeMidis.has(key.midi);
            const isTarget = targetPianoNotes.has(key.midi);
            const isSung = sungPianoMidi === key.midi;

            let bgColor = "bg-gradient-to-b from-[#181920] to-[#0A0B0E] text-zinc-400";
            if (isTarget && isSung) {
              bgColor = "bg-gradient-to-b from-teal-400 to-emerald-500 text-black shadow-[0_0_15px_#10B981]";
            } else if (isSung) {
              bgColor = "bg-gradient-to-b from-emerald-500 to-teal-600 text-white shadow-[0_0_12px_#10B981]";
            } else if (isTarget) {
              bgColor = "bg-gradient-to-b from-blue-500 to-indigo-700 text-white shadow-[0_0_15px_#3B82F6]";
            } else if (isManualPressed) {
              bgColor = "bg-zinc-700 text-white";
            }

            return (
              <div
                key={key.midi}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: "62%",
                }}
                onMouseDown={() => handleKeyTouchDown(key.midi)}
                onMouseUp={() => handleKeyTouchUp(key.midi)}
                onMouseEnter={() => handleMouseEnter(key.midi)}
                onMouseLeave={() => handleMouseLeave(key.midi)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleKeyTouchDown(key.midi);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleKeyTouchUp(key.midi);
                }}
                className={`absolute top-0 rounded-b-md border border-t-0 border-black/80 flex flex-col justify-end items-center pb-1 transition-all pointer-events-auto cursor-pointer shadow-lg z-10 ${bgColor}`}
              >
                <span className="text-[8px] font-mono font-bold leading-none">{key.anglo}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
