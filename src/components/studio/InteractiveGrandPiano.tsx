"use client";

// src/components/studio/InteractiveGrandPiano.tsx
import React, { useEffect, useState } from 'react';
import { grandPiano, midiToNoteInfo } from '../../audio/grandPianoEngine';
import { Piano, Volume2, ChevronDown, ChevronUp } from 'lucide-react';

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
  // Detección responsive para móvil vs escritorio
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isCollapsedOnMobile, setIsCollapsedOnMobile] = useState<boolean>(false);

  // Rango por defecto: Desktop = 4 octavas (C2 a C6) | Mobile = 1.8 octavas (C3 a G4)
  const [startOctave, setStartOctave] = useState<number>(2);
  const [visibleOctaves, setVisibleOctaves] = useState<number>(4);
  const [activePianoNotes, setActivePianoNotes] = useState<Set<number>>(new Set());
  const [sustain, setSustain] = useState<boolean>(false);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [samplerReady, setSamplerReady] = useState<boolean>(grandPiano.getLoadedState());

  useEffect(() => {
    const handleResize = () => {
      const mob = window.innerWidth < 768;
      setIsMobile(mob);
      if (mob) {
        setVisibleOctaves(1.8);
        setStartOctave(3); // C3 a G4 (registro central para vocalizar en teléfono)
      } else {
        setVisibleOctaves(4);
        setStartOctave(2);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = grandPiano.subscribe((notes) => {
      setActivePianoNotes(notes);
      setSamplerReady(grandPiano.getLoadedState());
    });
    return unsubscribe;
  }, []);

  // Listener global para soltar el ratón en cualquier parte de la ventana
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      if (!sustain) {
        grandPiano.releaseAll();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [sustain]);

  const effectiveStartOctave = isMobile ? Math.max(1, Math.min(5, startOctave)) : startOctave;
  const effectiveVisibleOctaves = isMobile ? 1.8 : visibleOctaves;

  const startMidi = (effectiveStartOctave + 1) * 12; // Ej. C3 = 48
  const endMidi = Math.round(startMidi + effectiveVisibleOctaves * 12);

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
      grandPiano.triggerAttack(midi, 0.85);
    }
  };

  const handleKeyLeave = (midi: number) => {
    if (isMouseDown && !sustain) {
      grandPiano.triggerRelease(midi);
    }
  };

  const handleKeyUp = (midi: number) => {
    if (!sustain) {
      grandPiano.triggerRelease(midi);
    }
  };

  // VISTA MÓVIL COLAPSADA: BARRA ULTRA COMPACTA PARA DAR MÁXIMO ESPACIO AL LIENZO
  if (isMobile && isCollapsedOnMobile) {
    const sungNote = detectedVoiceMidi ? midiToNoteInfo(detectedVoiceMidi) : null;

    return (
      <div className="h-10 bg-[#0F111A] border-t border-white/10 px-3 flex items-center justify-between text-xs font-mono z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Piano className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] text-zinc-300 font-semibold">Teclado Oculto</span>
          {sungNote && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
              Voz: {sungNote.solfege} ({sungNote.scientific})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsedOnMobile(false)}
          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm"
        >
          <span>Mostrar Teclado</span>
          <ChevronUp size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#0D0F16] border-t border-white/10 flex flex-col select-none z-20 shrink-0 ${
        isMobile ? 'h-36' : 'h-44'
      }`}
      onMouseUp={() => {
        setIsMouseDown(false);
        if (!sustain) grandPiano.releaseAll();
      }}
      onMouseLeave={() => {
        setIsMouseDown(false);
        if (!sustain) grandPiano.releaseAll();
      }}
    >
      {/* Barra de control del Grand Piano */}
      <div className="h-8 md:h-9 px-2.5 md:px-4 bg-[#11131A] border-b border-white/5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold truncate">
            <Piano className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 shrink-0" />
            <span className="hidden sm:inline">Yamaha Salamander Grand Piano</span>
            <span className="sm:hidden text-[11px]">Grand Piano</span>
            <span
              className={`ml-1 px-1.5 py-0.5 text-[9px] md:text-[10px] rounded ${
                samplerReady
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {samplerReady ? 'Activo' : 'Cargar'}
            </span>
          </div>

          {/* Leyenda de colores en vivo (Solo desktop) */}
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
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          <button
            onClick={() => {
              const next = !sustain;
              setSustain(next);
              grandPiano.setSustain(next);
            }}
            className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded text-[10px] md:text-[11px] transition border cursor-pointer ${
              sustain
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            Sustain: {sustain ? 'ON' : 'OFF'}
          </button>

          <div className="flex items-center gap-1 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
            <button
              onClick={() => setStartOctave((o) => Math.max(1, o - 1))}
              className="px-1 text-slate-400 hover:text-white cursor-pointer"
              title="Octava anterior"
            >
              ◀
            </button>
            <span className="text-[10px] md:text-[11px] text-slate-300 px-0.5">
              C{effectiveStartOctave}
            </span>
            <button
              onClick={() => setStartOctave((o) => Math.min(5, o + 1))}
              className="px-1 text-slate-400 hover:text-white cursor-pointer"
              title="Siguiente octava"
            >
              ▶
            </button>
          </div>

          {/* Botón Minimizar Teclado en Móvil */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setIsCollapsedOnMobile(true)}
              className="p-1 rounded text-zinc-400 hover:text-white bg-white/5 border border-white/10"
              title="Ocultar teclado para agrandar lienzo"
            >
              <ChevronDown size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Contenedor de Teclas Vectoriales */}
      <div className="relative flex-1 flex px-1 md:px-2 pt-0.5 md:pt-1 pb-1 md:pb-2 bg-[#08090D] overflow-hidden">
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
                onMouseLeave={() => handleKeyLeave(key.midi)}
                onMouseUp={() => handleKeyUp(key.midi)}
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleKeyDown(key.midi);
                }}
                onTouchEnd={() => handleKeyUp(key.midi)}
                onTouchCancel={() => handleKeyUp(key.midi)}
                className={`w-full h-full mx-[0.5px] md:mx-[1px] rounded-b-md border border-slate-300/80 flex flex-col justify-between items-center pb-1 pt-0.5 md:pb-1.5 md:pt-1 cursor-pointer transition-all duration-75 ${
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
                    <span className="px-1 py-0.2 bg-blue-600 text-white text-[7px] md:text-[8px] font-mono font-bold rounded">
                      GRAVE
                    </span>
                  )}
                  {isPassaggio && (
                    <span className="px-1 py-0.2 bg-purple-600 text-white text-[7px] md:text-[8px] font-mono font-bold rounded">
                      PUENTE
                    </span>
                  )}
                  {isHighest && (
                    <span className="px-1 py-0.2 bg-cyan-600 text-white text-[7px] md:text-[8px] font-mono font-bold rounded">
                      AGUDA
                    </span>
                  )}
                </div>

                {/* Etiqueta Solfeo + Científica */}
                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[9px] md:text-[10px] font-bold font-mono">{key.solfege}</span>
                  <span className="text-[8px] md:text-[9px] opacity-65 font-mono">{key.scientific}</span>
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
                    onMouseLeave={(e) => {
                      e.stopPropagation();
                      handleKeyLeave(blackKey.midi);
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
                    onTouchCancel={(e) => {
                      e.stopPropagation();
                      handleKeyUp(blackKey.midi);
                    }}
                    className={`absolute right-0 translate-x-1/2 top-0 w-[64%] h-[60%] md:h-[62%] z-10 rounded-b-md border border-black flex flex-col justify-end items-center pb-1 md:pb-1.5 cursor-pointer transition-all duration-75 ${
                      isBlackVoiceSinging
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.9)]'
                        : isBlackPianoPlaying
                        ? 'bg-blue-500 text-white shadow-[0_0_16px_rgba(59,130,246,0.9)]'
                        : 'bg-gradient-to-b from-slate-800 via-slate-900 to-black text-slate-300 hover:from-slate-700'
                    }`}
                  >
                    <span className="text-[7px] md:text-[8px] font-mono opacity-80">{blackKey.solfege}</span>
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
