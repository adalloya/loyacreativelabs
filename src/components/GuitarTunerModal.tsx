"use client";

import React, { useState, useEffect } from "react";
import { PitchData, vocalSynth } from "@/lib/vocalEngine";
import { Guitar, Mic, MicOff, Volume2, CheckCircle, X, Sparkles } from "lucide-react";

interface GuitarTunerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPitch: PitchData | null;
  isListening: boolean;
  onToggleMic: () => void;
}

const GUITAR_TUNINGS: Record<string, Array<{ stringNum: number; note: string; midi: number; freq: number }>> = {
  standard: [
    { stringNum: 6, note: "E2", midi: 40, freq: 82.41 },
    { stringNum: 5, note: "A2", midi: 45, freq: 110.0 },
    { stringNum: 4, note: "D3", midi: 50, freq: 146.83 },
    { stringNum: 3, note: "G3", midi: 55, freq: 196.0 },
    { stringNum: 2, note: "B3", midi: 59, freq: 246.94 },
    { stringNum: 1, note: "E4", midi: 64, freq: 329.63 },
  ],
  dropD: [
    { stringNum: 6, note: "D2", midi: 38, freq: 73.42 },
    { stringNum: 5, note: "A2", midi: 45, freq: 110.0 },
    { stringNum: 4, note: "D3", midi: 50, freq: 146.83 },
    { stringNum: 3, note: "G3", midi: 55, freq: 196.0 },
    { stringNum: 2, note: "B3", midi: 59, freq: 246.94 },
    { stringNum: 1, note: "E4", midi: 64, freq: 329.63 },
  ],
};

export default function GuitarTunerModal({
  isOpen,
  onClose,
  currentPitch,
  isListening,
  onToggleMic,
}: GuitarTunerModalProps) {
  const [tuningKey, setTuningKey] = useState<"standard" | "dropD">("standard");
  const [selectedString, setSelectedString] = useState<number>(1); // Cuerda 1 por defecto (E4)

  const currentStrings = GUITAR_TUNINGS[tuningKey];
  const targetStringData = currentStrings.find((s) => s.stringNum === selectedString) || currentStrings[5];

  // Encontrar la cuerda más cercana a la frecuencia que está sonando en el micrófono
  useEffect(() => {
    if (!currentPitch || currentPitch.clarity < 0.7) return;
    // Buscar cuál cuerda del instrumento está más cerca en Hz
    let closest = currentStrings[0];
    let minDiff = Math.abs(currentPitch.frequency - closest.freq);

    for (const s of currentStrings) {
      const diff = Math.abs(currentPitch.frequency - s.freq);
      if (diff < minDiff) {
        minDiff = diff;
        closest = s;
      }
    }
    // Si la diferencia es menor a 25 Hz, auto-seleccionamos esa cuerda
    if (minDiff < 22) {
      setSelectedString(closest.stringNum);
    }
  }, [currentPitch, currentStrings]);

  if (!isOpen) return null;

  const cents = currentPitch ? currentPitch.cents : 0;
  const isSelectedStringInTune =
    currentPitch &&
    Math.abs(currentPitch.frequency - targetStringData.freq) < 2.5 &&
    Math.abs(cents) <= 8;

  const playReferenceNote = (midi: number) => {
    vocalSynth.playNote(midi, 1.5, 0.3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="apple-glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 border border-white/15 flex flex-col gap-5 max-h-[95vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#0A84FF]/20 text-[#0A84FF]">
              <Guitar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Afinador de Guitarra Pro</h2>
              <p className="text-xs text-zinc-400">Detección cromática y referencia por cuerdas</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full bg-white/10 text-zinc-300 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Estado del Micrófono y Selector de Afinación */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setTuningKey("standard")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                tuningKey === "standard" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Estándar (E-A-D-G-B-E)
            </button>
            <button
              onClick={() => setTuningKey("dropD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                tuningKey === "dropD" ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              Drop D (D-A-D...)
            </button>
          </div>

          <button
            onClick={onToggleMic}
            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isListening
                ? "bg-[#30D158] text-black font-bold shadow-[0_0_15px_rgba(48,209,88,0.4)]"
                : "bg-[#0A84FF] text-white shadow-[0_0_15px_rgba(10,132,255,0.4)]"
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            {isListening ? "Mic On" : "Activar Mic"}
          </button>
        </div>

        {/* Visualizador Principal de Afinación de la Cuerda Seleccionada */}
        <div className="p-6 rounded-3xl bg-black/60 border border-white/15 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Cuerda Objetivo: <strong className="text-white">#{targetStringData.stringNum} — {targetStringData.note}</strong></span>
          </div>

          {/* Nota Gigante */}
          <div className="my-3 flex flex-col items-center">
            <div
              className={`text-7xl font-bold tracking-tight transition-colors ${
                isSelectedStringInTune
                  ? "text-[#30D158] drop-shadow-[0_0_25px_rgba(48,209,88,0.4)]"
                  : "text-white"
              }`}
            >
              {currentPitch ? currentPitch.noteName : targetStringData.note}
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs font-mono text-zinc-400">
              <span>{currentPitch ? `${currentPitch.frequency} Hz` : `${targetStringData.freq} Hz (Meta)`}</span>
              <span>•</span>
              <span className={isSelectedStringInTune ? "text-[#30D158] font-bold" : "text-amber-400"}>
                {currentPitch ? `${cents > 0 ? `+${cents}` : cents} cents` : "Toca la cuerda"}
              </span>
            </div>
          </div>

          {/* Aguja de Cents (-50 a +50) */}
          <div className="w-full">
            <div className="relative h-3 w-full bg-zinc-900 rounded-full border border-white/10 overflow-hidden">
              <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[24%] bg-[#30D158]/20 border-x border-[#30D158]/40" />
              {currentPitch && (
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full transition-all duration-75"
                  style={{
                    left: `calc(${Math.min(96, Math.max(4, 50 + cents))}% - 4px)`,
                    backgroundColor: isSelectedStringInTune ? "#30D158" : "#FFD60A",
                    boxShadow: `0 0 10px ${isSelectedStringInTune ? "#30D158" : "#FFD60A"}`,
                  }}
                />
              )}
            </div>
          </div>

          {isSelectedStringInTune && (
            <div className="flex items-center gap-1.5 text-xs text-[#30D158] font-bold animate-bounce">
              <CheckCircle className="w-4 h-4" /> ¡Cuerda Perfectamente Afinada!
            </div>
          )}
        </div>

        {/* Botones de las 6 Cuerdas de la Guitarra (Tocar para escuchar referencia o fijar objetivo) */}
        <div className="grid grid-cols-6 gap-2">
          {currentStrings.map((s) => {
            const isSelected = selectedString === s.stringNum;
            return (
              <button
                key={s.stringNum}
                onClick={() => {
                  setSelectedString(s.stringNum);
                  playReferenceNote(s.midi);
                }}
                className={`py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition border cursor-pointer ${
                  isSelected
                    ? "bg-[#0A84FF] text-white border-white shadow-[0_0_20px_rgba(10,132,255,0.4)] scale-105"
                    : "bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10"
                }`}
              >
                <span className="text-xs font-bold">{s.note}</span>
                <span className="text-[9px] opacity-70">#{s.stringNum}</span>
                <Volume2 className="w-3 h-3 opacity-60 mt-0.5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
