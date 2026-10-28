"use client";

import React, { useState, useEffect, useRef } from "react";
import { PitchData, midiToNoteName, vocalSynth } from "@/lib/vocalEngine";
import {
  Sliders,
  Sun,
  Volume2,
  CheckCircle2,
  X,
  Activity,
  Sparkles,
} from "lucide-react";

export interface UserVocalProfile {
  lowestMidi: number;
  highestMidi: number;
  passaggioMidi: number;
  voiceType: string;
}

interface VocalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPitch: PitchData | null;
  isListening: boolean;
  onToggleMic: () => void;
  profile: UserVocalProfile;
  onUpdateProfile: (newProfile: UserVocalProfile) => void;
  wakeLockEnabled: boolean;
  onToggleWakeLock: () => void;
}

export function classifyVoice(lowestMidi: number, highestMidi: number): {
  voiceType: string;
  passaggioMidi: number;
} {
  const center = (lowestMidi + highestMidi) / 2;
  if (center < 51) {
    return { voiceType: "Bajo / Barítono Profundo", passaggioMidi: 59 }; // B3
  } else if (center < 56) {
    return { voiceType: "Barítono (Rango Medio-Grave)", passaggioMidi: 62 }; // D4
  } else if (center < 61) {
    return { voiceType: "Tenor / Registro Medio-Alto", passaggioMidi: 64 }; // E4
  } else if (center < 66) {
    return { voiceType: "Mezzosoprano / Contralto", passaggioMidi: 66 }; // F#4
  } else {
    return { voiceType: "Soprano / Registro Agudo", passaggioMidi: 68 }; // G#4
  }
}

export default function VocalProfileModal({
  isOpen,
  onClose,
  currentPitch,
  isListening,
  onToggleMic,
  profile,
  onUpdateProfile,
  wakeLockEnabled,
  onToggleWakeLock,
}: VocalProfileModalProps) {
  const [scanStep, setScanStep] = useState<"idle" | "low" | "high" | "done">("idle");
  const [detectedLow, setDetectedLow] = useState<number>(profile.lowestMidi);
  const [detectedHigh, setDetectedHigh] = useState<number>(profile.highestMidi);

  // Metrónomo rápido de bolsillo
  const [metroBpm, setMetroBpm] = useState<number>(120);
  const [metroPlaying, setMetroPlaying] = useState<boolean>(false);
  const [metroBeat, setMetroBeat] = useState<number>(0);
  const metroRef = useRef<NodeJS.Timeout | null>(null);

  // Captura en vivo durante el escaneo de tesitura
  useEffect(() => {
    if (!currentPitch || currentPitch.clarity < 0.75) return;

    if (scanStep === "low") {
      if (currentPitch.midi >= 36 && currentPitch.midi < detectedLow) {
        setDetectedLow(currentPitch.midi);
      }
    } else if (scanStep === "high") {
      if (currentPitch.midi <= 84 && currentPitch.midi > detectedHigh) {
        setDetectedHigh(currentPitch.midi);
      }
    }
  }, [currentPitch, scanStep, detectedLow, detectedHigh]);

  // Motor del metrónomo
  useEffect(() => {
    if (!metroPlaying) {
      if (metroRef.current) clearInterval(metroRef.current);
      setMetroBeat(0);
      return;
    }

    const intervalMs = (60 / metroBpm) * 1000;
    let beatCount = 0;

    const tick = () => {
      beatCount = (beatCount % 4) + 1;
      setMetroBeat(beatCount);
      vocalSynth.playNote(beatCount === 1 ? 76 : 69, 0.06, beatCount === 1 ? 0.25 : 0.12);
    };

    tick();
    metroRef.current = setInterval(tick, intervalMs);
    return () => {
      if (metroRef.current) clearInterval(metroRef.current);
    };
  }, [metroPlaying, metroBpm]);

  if (!isOpen) return null;

  const startLowScan = () => {
    if (!isListening) onToggleMic();
    setDetectedLow(60); // Empezar desde C4 hacia abajo
    setScanStep("low");
  };

  const startHighScan = () => {
    if (!isListening) onToggleMic();
    setDetectedHigh(48); // Empezar desde C3 hacia arriba
    setScanStep("high");
  };

  const finishScan = () => {
    const { voiceType, passaggioMidi } = classifyVoice(detectedLow, detectedHigh);
    onUpdateProfile({
      lowestMidi: detectedLow,
      highestMidi: detectedHigh,
      passaggioMidi,
      voiceType,
    });
    setScanStep("done");
  };

  const totalSemitones = Math.max(1, profile.highestMidi - profile.lowestMidi);
  const octaves = (totalSemitones / 12).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="apple-glass w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 border border-white/15 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#0A84FF]/20 text-[#0A84FF]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Perfil Vocal & Herramientas de Clase</h2>
              <p className="text-xs text-zinc-400">Calibración de Tesitura, Metrónomo y Pantalla</p>
            </div>
          </div>

          <button
            onClick={() => {
              setMetroPlaying(false);
              onClose();
            }}
            className="p-2 rounded-full bg-white/10 text-zinc-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Modo Atril (Screen Wake Lock para que no se bloquee el celular al cantar) */}
        <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                wakeLockEnabled ? "bg-amber-400/20 text-amber-300" : "bg-white/10 text-zinc-400"
              }`}
            >
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Modo Atril (Pantalla Siempre Activa)</div>
              <p className="text-[11px] text-zinc-400">
                Evita que tu teléfono se bloquee mientras cantas sin tocar la pantalla
              </p>
            </div>
          </div>

          <button
            onClick={onToggleWakeLock}
            className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
              wakeLockEnabled
                ? "bg-[#30D158] text-black shadow-[0_0_15px_rgba(48,209,88,0.4)]"
                : "bg-white/10 text-zinc-300 hover:bg-white/15"
            }`}
          >
            {wakeLockEnabled ? "ACTIVO" : "ACTIVAR"}
          </button>
        </div>

        {/* 2. Tarjeta de Tesitura y Escáner de Rango Vocal */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0A84FF]/15 via-[#BF5AF2]/10 to-transparent border border-white/15 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0A84FF]">
                Tu Rango Vocal Registrado
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{profile.voiceType}</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-[#30D158]">
              {octaves} Octavas
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <div className="text-[10px] text-zinc-400">Nota Más Grave</div>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {midiToNoteName(profile.lowestMidi, "both")}
              </div>
              <button
                type="button"
                onClick={() => vocalSynth.playNote(profile.lowestMidi, 0.9, 0.3)}
                className="mt-1 text-[10px] text-[#0A84FF] flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Volume2 className="w-3 h-3" /> Escuchar
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-[#BF5AF2]/40">
              <div className="text-[10px] text-[#BF5AF2] font-semibold">Puente (Passaggio)</div>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {midiToNoteName(profile.passaggioMidi, "both")}
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">Cambiar a Mixta</span>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-white/10">
              <div className="text-[10px] text-zinc-400">Nota Más Aguda</div>
              <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                {midiToNoteName(profile.highestMidi, "both")}
              </div>
              <button
                type="button"
                onClick={() => vocalSynth.playNote(profile.highestMidi, 0.9, 0.3)}
                className="mt-1 text-[10px] text-[#0A84FF] flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Volume2 className="w-3 h-3" /> Escuchar
              </button>
            </div>
          </div>

          {/* Asistente de Escaneo en 2 Pasos */}
          {scanStep === "idle" && (
            <button
              onClick={startLowScan}
              className="w-full py-3 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(10,132,255,0.35)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Medir Mi Rango Vocal Ahora (30 seg)
            </button>
          )}

          {scanStep === "low" && (
            <div className="p-4 rounded-xl bg-black/60 border border-[#0A84FF] flex flex-col gap-3">
              <div className="text-xs text-white font-semibold">
                Paso 1/2: Canta tu nota más GRAVE cómoda con &quot;Ahhh&quot;
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Voz actual: {currentPitch?.noteName || "..."}</span>
                <span className="text-[#30D158] font-bold">
                  Mínimo captado: {midiToNoteName(detectedLow)}
                </span>
              </div>
              <button
                onClick={startHighScan}
                className="w-full py-2.5 rounded-xl bg-[#30D158] text-black font-bold text-xs cursor-pointer hover:brightness-105"
              >
                Listo, ahora medir mi nota más Aguda →
              </button>
            </div>
          )}

          {scanStep === "high" && (
            <div className="p-4 rounded-xl bg-black/60 border border-[#BF5AF2] flex flex-col gap-3">
              <div className="text-xs text-white font-semibold">
                Paso 2/2: Haz una sirena hacia tu nota más AGUDA (sin gritar)
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Voz actual: {currentPitch?.noteName || "..."}</span>
                <span className="text-[#BF5AF2] font-bold">
                  Máximo captado: {midiToNoteName(detectedHigh)}
                </span>
              </div>
              <button
                onClick={finishScan}
                className="w-full py-2.5 rounded-xl bg-[#BF5AF2] text-white font-bold text-xs cursor-pointer hover:brightness-105"
              >
                Guardar Mi Nueva Tesitura
              </button>
            </div>
          )}

          {scanStep === "done" && (
            <div className="flex items-center justify-between text-xs text-[#30D158] bg-[#30D158]/10 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> ¡Tesitura actualizada y guardada en tu dispositivo!
              </span>
              <button onClick={() => setScanStep("idle")} className="underline text-zinc-300 cursor-pointer">
                Repetir
              </button>
            </div>
          )}
        </div>

        {/* 3. Metrónomo Visual y Sonoro de Bolsillo */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#30D158]" />
              <span className="text-xs font-bold text-white">Metrónomo de Práctica ({metroBpm} BPM)</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((b) => (
                <span
                  key={b}
                  className={`w-3 h-3 rounded-full transition-all ${
                    metroBeat === b
                      ? b === 1
                        ? "bg-[#30D158] scale-125 shadow-[0_0_10px_#30D158]"
                        : "bg-[#0A84FF] scale-110"
                      : "bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50}
              max={180}
              value={metroBpm}
              onChange={(e) => setMetroBpm(Number(e.target.value))}
              className="flex-1 accent-[#30D158] cursor-pointer"
            />
            <button
              onClick={() => setMetroPlaying(!metroPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                metroPlaying ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {metroPlaying ? "Detener" : "Iniciar Pulso"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
