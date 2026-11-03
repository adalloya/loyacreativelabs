"use client";

// src/components/studio/InteractiveGrandPiano.tsx
import React, { useEffect, useState } from 'react';
import { grandPiano, midiToNoteInfo } from '../../audio/grandPianoEngine';
import { Piano, Volume2 } from 'lucide-react';

export interface InteractiveGrandPianoProps {
  detectedVoiceMidi: number | null; // Nota MIDI que el usuario está cantando ahora mismo
  voiceCentsOff?: number;
  lowestVocalMidi?: number;         // La2 = 45
  passaggioVocalMidi?: number;      // Re4 = 62
  highestVocalMidi?: number;        // Mi4 = 64
}

export const InteractiveGrandPiano: React.FC<InteractiveGrandPianoProps> = ({
  detectedVoiceMidi,
  voiceCentsOff = 0,
  lowestVocalMidi = 45,
  passaggioVocalMidi = 62,
  highestVocalMidi = 64,
}) => {
  // Rango por defecto: C2 (36) a C6 (84) -> 49 teclas completas (desplazable de A0 a C8)
  const [startOctave, setStartOctave] = useState<number>(2);
  const [visibleOctaves] = useState<number>(4);
  const [activePianoNotes, setActivePianoNotes] = useState<Set<number>>(new Set());
  const [sustain, setSustain] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [samplerReady, setSamplerReady] = useState<boolean>(grandPiano.getLoadedState());

  useEffect(() => {
    const unsubscribe = grandPiano.subscribe((notes) => {
      setActivePianoNotes(notes);
      setSamplerReady(grandPiano.getLoadedState());
    });
    return unsubscribe;
  }, []);

  const startMidi = (startOctave + 1) * 12; // C2 = 36
  const endMidi = startMidi + visibleOctaves * 12; // C6 = 84

  const allKeys = [];
  for (let m = startMidi; m <= endMidi; m++) {
    allKeys.push(midiToNoteInfo(m));
  }

  const whiteKeys = allKeys.filter((k) => !k.isSharp);

  const handleKeyDown = async (midi: number) => {
    setIsMouseDown(true);
    await grandPiano.triggerAttack(midi, 0.9);
    setSamplerReady(true);
  };

  const handleKeyEnter = (midi: number) => {
    if (isMouseDown) {
      grandPiano.triggerAttack(midi, 0.8);
    }
  };

  const handleKeyUp = (midi: number) => {
    grandPiano.triggerRelease(midi);
  };

  return (
    <div
      className="h-44 bg-[#0D0F16] border-t border-white/10 flex flex-col select-none z-20 shrink-0"
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
    >
      {/* Barra de control del Grand Piano */}
      <div className="h-9 px-4 bg-[#11131A] border-b border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <Piano className="w-4 h-4 text-blue-400" />
            <span>Yamaha Salamander Grand Piano</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[10px] rounded ${
                samplerReady
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {samplerReady ? 'Samples Activos' : 'Click para Cargar Audio'}
            </span>
          </div>

          {/* Leyenda de colores en vivo */}
          <div className="hidden md:flex items-center gap-4 pl-4 border-l border-white/10 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Tecla Piano / Ejercicio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Tu Voz en Tiempo Real
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> Puente Passaggio (Re4)
            </span>
          </div>
        </div>

        {/* Controles de Octava y Pedal Sustain */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !sustain;
              setSustain(next);
              grandPiano.setSustain(next);
            }}
            className={`px-2.5 py-1 rounded text-[11px] transition border cursor-pointer ${
              sustain
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            Pedal Sustain: {sustain ? 'ON' : 'OFF'}
          </button>

          <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
            <button
              onClick={() => setStartOctave((o) => Math.max(0, o - 1))}
              className="px-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              ◀ Oct
            </button>
            <span className="text-[11px] text-slate-300 px-1">
              C{startOctave} - C{startOctave + visibleOctaves}
            </span>
            <button
              onClick={() => setStartOctave((o) => Math.min(4, o + 1))}
              className="px-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              Oct ▶
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de Teclas Vectoriales */}
      <div className="relative flex-1 flex px-2 pt-1 pb-2 bg-[#08090D] overflow-hidden">
        {whiteKeys.map((key) => {
          const isPianoPlaying = activePianoNotes.has(key.midi);
          const isVoiceSinging = detectedVoiceMidi === key.midi;
          const isLowest = key.midi === lowestVocalMidi;
          const isPassaggio = key.midi === passaggioVocalMidi;
          const isHighest = key.midi === highestVocalMidi;

          // Verificar si esta tecla blanca tiene una tecla negra inmediatamente a su derecha
          const nextMidiInfo = midiToNoteInfo(key.midi + 1);
          const hasBlackKeyRight = nextMidiInfo.isSharp && key.midi + 1 <= endMidi;

          return (
            <div key={key.midi} className="relative flex-1 h-full flex select-none">
              {/* TECLA BLANCA */}
              <div
                onMouseDown={() => handleKeyDown(key.midi)}
                onMouseEnter={() => handleKeyEnter(key.midi)}
                onMouseUp={() => handleKeyUp(key.midi)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleKeyDown(key.midi);
                }}
                onTouchEnd={() => handleKeyUp(key.midi)}
                className={`w-full h-full mx-[1px] rounded-b-md border border-slate-300/80 flex flex-col justify-between items-center pb-1.5 pt-1 cursor-pointer transition-all duration-75 ${
                  isVoiceSinging
                    ? Math.abs(voiceCentsOff) <= 20
                      ? 'bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.8)] translate-y-[2px]'
                      : 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.8)] translate-y-[2px]'
                    : isPianoPlaying
                    ? 'bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.75)] translate-y-[2px]'
                    : 'bg-gradient-to-b from-slate-100 to-white text-slate-700 hover:from-white hover:to-blue-50'
                }`}
              >
                {/* Marcador de Tesitura del Usuario */}
                <div className="w-full flex justify-center">
                  {isLowest && (
                    <span className="px-1 py-0.2 bg-blue-600 text-white text-[8px] font-mono font-bold rounded">
                      GRAVE
                    </span>
                  )}
                  {isPassaggio && (
                    <span className="px-1 py-0.2 bg-purple-600 text-white text-[8px] font-mono font-bold rounded">
                      PUENTE
                    </span>
                  )}
                  {isHighest && (
                    <span className="px-1 py-0.2 bg-cyan-600 text-white text-[8px] font-mono font-bold rounded">
                      AGUDA
                    </span>
                  )}
                </div>

                {/* Etiqueta Solfeo + Científica */}
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[10px] font-bold font-mono">{key.solfege}</span>
                  <span className="text-[9px] opacity-65 font-mono">{key.scientific}</span>
                </div>
              </div>

              {/* TECLA NEGRA SUPERPUESTA (SI CORRESPONDE) */}
              {hasBlackKeyRight && (() => {
                const blackKey = nextMidiInfo;
                const isBlackPianoPlaying = activePianoNotes.has(blackKey.midi);
                const isBlackVoiceSinging = detectedVoiceMidi === blackKey.midi;

                return (
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleKeyDown(blackKey.midi);
                    }}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      handleKeyEnter(blackKey.midi);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      handleKeyUp(blackKey.midi);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleKeyDown(blackKey.midi);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      handleKeyUp(blackKey.midi);
                    }}
                    className={`absolute right-0 translate-x-1/2 top-0 w-[64%] h-[62%] z-10 rounded-b-md border border-black flex flex-col justify-end items-center pb-1.5 cursor-pointer transition-all duration-75 ${
                      isBlackVoiceSinging
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                        : isBlackPianoPlaying
                        ? 'bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.9)]'
                        : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black text-slate-300 hover:from-slate-700'
                    }`}
                  >
                    <span className="text-[8px] font-mono opacity-80">{blackKey.solfege}</span>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InteractiveGrandPiano;
