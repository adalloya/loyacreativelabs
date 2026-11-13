"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useVocalSession } from "@/store/vocalSessionStore";
import {
  Mic,
  MicOff,
  Circle,
  Square,
  Volume2,
  Waves,
  Sun,
  Guitar,
  ChevronDown,
  Layers,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  PanelLeftClose,
  PanelLeftOpen,
  Tv,
  MoreHorizontal,
  X,
  Piano,
} from "lucide-react";
import { SOLFEGE_NAMES, NOTE_NAMES, midiToNoteName } from "@/lib/vocalEngine";

export default function TopStudioBar() {
  const {
    isListening,
    toggleMic,
    currentPitch,
    inputGain,
    setInputGain,
    isRecordingTake,
    recordingTitle,
    setRecordingTitle,
    recordingSeconds,
    startRecordingTake,
    stopRecordingTake,
    metronomePlaying,
    metronomeBpm,
    setMetronomeBpm,
    toggleMetronome,
    reverbActive,
    toggleReverb,
    wakeLockActive,
    toggleWakeLock,
    guitarTunerOpen,
    toggleGuitarTuner,
    vocalProfile,
    updateVocalProfile,
    isProfilePopoverOpen,
    setIsProfilePopoverOpen,
    isDrawerOpen,
    toggleDrawer,
    teleprompterOpen,
    toggleTeleprompter,
    alesisStudioOpen,
    toggleAlesisStudio,
  } = useVocalSession();

  const [showGainSlider, setShowGainSlider] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Tap Tempo para el metrónomo
  const handleTapTempo = () => {
    const now = performance.now();
    const newTaps = [...tapTimes.filter((t) => now - t < 2500), now];
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.min(240, Math.max(40, Math.round(60000 / avgInterval)));
      setMetronomeBpm(calculatedBpm);
    }
  };

  const lowestName = midiToNoteName(vocalProfile.lowestMidi, "both");
  const highestName = midiToNoteName(vocalProfile.highestMidi, "both");
  const passaggioName = midiToNoteName(vocalProfile.passaggioMidi, "both");
  const octavesRange = ((vocalProfile.highestMidi - vocalProfile.lowestMidi) / 12).toFixed(1);

  return (
    <header className="h-14 bg-[#11131A] border-b border-white/[0.08] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0 select-none z-30">
      {/* 1. Izquierda: Logo, Drawer Toggle & Micrófono Maestro */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={toggleDrawer}
          className={`p-1.5 rounded-lg border transition-colors ${
            isDrawerOpen
              ? "bg-white/10 text-white border-white/15"
              : "bg-white/[0.04] text-zinc-400 hover:text-white border-white/10"
          }`}
          title={isDrawerOpen ? "Ocultar panel lateral" : "Mostrar panel lateral"}
        >
          {isDrawerOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>

        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-black/80 border border-white/15 p-1 flex items-center justify-center shadow">
            <Image
              src="/acapella-icon.png"
              alt="Acapella"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <span className="font-bold text-sm text-white tracking-tight hidden lg:inline">
            Acapella <span className="text-[10px] font-mono font-normal text-zinc-400">DAW</span>
          </span>
        </Link>

        {/* Botón Maestro de Micrófono DSP */}
        <div className="relative flex items-center">
          <button
            onClick={toggleMic}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isListening
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-white/[0.05] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            }`}
          >
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                <Mic size={14} className="text-emerald-400" />
                <span className="font-mono text-[11px] uppercase tracking-wider hidden sm:inline">DSP ON</span>
              </>
            ) : (
              <>
                <MicOff size={14} className="text-zinc-500" />
                <span className="font-mono text-[11px] uppercase tracking-wider hidden sm:inline">DSP OFF</span>
              </>
            )}
          </button>

          {/* Ajuste rápido de ganancia de entrada */}
          {isListening && (
            <button
              onClick={() => setShowGainSlider(!showGainSlider)}
              className="ml-1 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
              title="Ajustar ganancia de micrófono"
            >
              <Sliders size={13} />
            </button>
          )}

          {showGainSlider && isListening && (
            <div className="absolute top-12 left-0 z-50 bg-[#161822] border border-white/15 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 w-48">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
                <span>Ganancia Mic</span>
                <span>{Math.round(inputGain * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.5"
                step="0.05"
                value={inputGain}
                onChange={(e) => setInputGain(parseFloat(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Modo Afinador de Guitarra Quick Switch */}
        <button
          onClick={toggleGuitarTuner}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition cursor-pointer ${
            guitarTunerOpen
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
              : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Modo Cuerdas de Guitarra (E2-E4 / Drop D)"
        >
          <Guitar size={14} className={guitarTunerOpen ? "text-amber-400" : "text-zinc-400"} />
          <span className="hidden xl:inline text-[11px]">Guitarra</span>
        </button>
      </div>

      {/* 2. Centro: Barra de Transporte y Herramientas Acústicas (Desktop) */}
      <div className="hidden md:flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar">
        {/* Grabación A/B Rápida */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
          {isRecordingTake ? (
            <button
              onClick={() => stopRecordingTake()}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.5)] transition active:scale-95 cursor-pointer"
            >
              <Square size={11} className="fill-white" />
              <span className="font-mono text-[11px]">
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
              </span>
            </button>
          ) : (
            <button
              onClick={() => startRecordingTake(recordingTitle)}
              className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Grabar Toma A/B instantánea"
            >
              <Circle size={10} className="fill-red-500 text-red-500 animate-pulse" />
              <span className="font-mono text-[11px] font-bold">REC</span>
            </button>
          )}

          <input
            type="text"
            value={recordingTitle}
            onChange={(e) => setRecordingTitle(e.target.value)}
            placeholder="Título de toma..."
            className="bg-transparent text-xs text-zinc-300 font-mono w-24 sm:w-36 px-2 py-0.5 focus:outline-none focus:text-white placeholder:text-zinc-600 hidden md:inline"
          />
        </div>

        {/* Metrónomo Compacto */}
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-2 py-1 gap-1.5">
          <button
            onClick={toggleMetronome}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
              metronomePlaying ? "bg-amber-500 text-black shadow-[0_0_10px_#F59E0B]" : "text-zinc-400 hover:text-white"
            }`}
            title={metronomePlaying ? "Detener metrónomo" : "Iniciar metrónomo"}
          >
            {metronomePlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
          </button>

          <span className="font-mono text-xs font-bold text-zinc-200 min-w-[48px] text-center">
            {metronomeBpm} <span className="text-[9px] text-zinc-500 font-normal">BPM</span>
          </span>

          <input
            type="range"
            min="50"
            max="200"
            value={metronomeBpm}
            onChange={(e) => setMetronomeBpm(parseInt(e.target.value, 10))}
            className="w-12 sm:w-16 accent-amber-400 hidden sm:inline cursor-pointer"
          />

          <button
            onClick={handleTapTempo}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 transition"
            title="Toca rítmicamente para ajustar BPM"
          >
            TAP
          </button>
        </div>

        {/* Monitoreo Reverb */}
        <button
          onClick={toggleReverb}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
            reverbActive
              ? "bg-purple-950/40 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]"
              : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Reverb Espacial de Sala de Conciertos (Audífonos recomendados)"
        >
          <Waves size={13} className={reverbActive ? "text-purple-400" : "text-zinc-500"} />
          <span className="text-[11px] hidden lg:inline">Reverb</span>
        </button>

        {/* Modo Atril (Wake Lock API) */}
        <button
          onClick={toggleWakeLock}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
            wakeLockActive
              ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
              : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Modo Atril: Mantiene la pantalla encendida mientras cantas"
        >
          <Sun size={13} className={wakeLockActive ? "text-cyan-400" : "text-zinc-500"} />
          <span className="text-[11px] hidden xl:inline">Atril</span>
        </button>

        {/* Teleprompter en Ventana */}
        <button
          type="button"
          onClick={toggleTeleprompter}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
            teleprompterOpen
              ? "bg-blue-600 text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)]"
              : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Abrir Teleprompter en Ventana (Letra Horizontal & Tiempos)"
        >
          <Tv size={13} className={teleprompterOpen ? "text-white" : "text-blue-400"} />
          <span className="text-[11px] hidden md:inline">Teleprompter</span>
        </button>

        {/* Sección Especial: Alesis Smart Piano Studio (USB-C MIDI & OSMD) */}
        <button
          type="button"
          onClick={toggleAlesisStudio}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition cursor-pointer ${
            alesisStudioOpen
              ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_14px_rgba(249,115,22,0.45)] font-bold"
              : "bg-orange-500/10 border-orange-500/30 text-orange-300 hover:bg-orange-500/20 hover:text-white"
          }`}
          title="Abrir Sección Especial: Alesis Smart Piano Studio (USB-C MIDI, LEDs 3 Colores & OSMD)"
        >
          <Piano size={13} className={alesisStudioOpen ? "text-white" : "text-orange-400"} />
          <span className="text-[11px] hidden md:inline">Alesis MIDI</span>
        </button>
      </div>

      {/* 2. Centro Mobile: Grabación Rápida */}
      <div className="flex md:hidden items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
          {isRecordingTake ? (
            <button
              onClick={() => stopRecordingTake()}
              className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-md"
            >
              <Square size={9} className="fill-white" />
              <span className="font-mono">
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
              </span>
            </button>
          ) : (
            <button
              onClick={() => startRecordingTake(recordingTitle)}
              className="px-2 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] font-semibold flex items-center gap-1"
            >
              <Circle size={7} className="fill-red-500 text-red-500 animate-pulse" />
              <span className="font-mono font-bold">REC</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Derecha: Badge de Rango Vocal & Herramientas Mobile */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Alesis Smart Piano Studio (Solo Mobile) */}
        <button
          type="button"
          onClick={toggleAlesisStudio}
          className={`p-1.5 rounded-xl border text-xs font-mono md:hidden transition cursor-pointer ${
            alesisStudioOpen
              ? "bg-orange-500 text-white border-orange-400"
              : "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:text-white"
          }`}
          title="Alesis Smart Piano Studio"
        >
          <Piano size={14} />
        </button>

        {/* Teleprompter en Ventana (Solo Mobile) */}
        <button
          type="button"
          onClick={toggleTeleprompter}
          className={`p-1.5 rounded-xl border text-xs font-mono md:hidden transition cursor-pointer ${
            teleprompterOpen
              ? "bg-blue-600 text-white border-blue-400"
              : "bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white"
          }`}
          title="Teleprompter en Vivo"
        >
          <Tv size={14} className={teleprompterOpen ? "text-white" : "text-blue-400"} />
        </button>

        {/* Botón de Herramientas Rápidas en Móvil */}
        <button
          type="button"
          onClick={() => setShowMobileTools(true)}
          className={`p-1.5 rounded-xl border text-xs font-mono md:hidden transition cursor-pointer ${
            showMobileTools
              ? "bg-blue-600 text-white border-blue-400"
              : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white"
          }`}
          title="Herramientas Acústicas y Metrónomo"
        >
          <MoreHorizontal size={15} />
        </button>

        {/* Badge de Tesitura */}
        <button
          onClick={() => setIsProfilePopoverOpen(!isProfilePopoverOpen)}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 transition cursor-pointer"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 font-mono text-[11px] sm:text-xs">
            <span className="text-blue-400 hidden sm:inline">{lowestName.split(" ")[0]}</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-purple-400 font-bold">{passaggioName.split(" ")[0]}</span>
            <span className="text-zinc-600 hidden sm:inline">•</span>
            <span className="text-amber-400 hidden sm:inline">{highestName.split(" ")[0]}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">({octavesRange} Oct)</span>
          <ChevronDown size={11} className="text-zinc-500" />
        </button>

        {/* Popover de Tesitura y Calibración Rápida */}
        {isProfilePopoverOpen && (
          <div className="absolute top-14 right-0 z-50 w-72 bg-[#14161F] border border-white/15 p-4 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Perfil de Tesitura
              </span>
              <span className="text-[10px] text-zinc-400">{vocalProfile.voiceType}</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Nota más Grave:</span>
                <span className="text-blue-400 font-bold">{lowestName}</span>
              </div>
              <div className="flex items-center justify-between bg-purple-500/10 p-2 rounded-xl border border-purple-500/20">
                <span className="text-purple-300">Puente / Passaggio:</span>
                <span className="text-purple-300 font-bold">{passaggioName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Nota más Aguda:</span>
                <span className="text-amber-400 font-bold">{highestName}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10">
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Tu zona de Passaggio colorea el lienzo central en violeta para avisarte cuándo pasar a Voz Mixta.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    updateVocalProfile({
                      ...vocalProfile,
                      passaggioMidi: vocalProfile.passaggioMidi === 62 ? 60 : 62,
                    });
                  }}
                  className="py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition cursor-pointer"
                >
                  Alternar C4/D4
                </button>
                <button
                  onClick={() => setIsProfilePopoverOpen(false)}
                  className="py-1.5 rounded-xl bg-white text-black text-xs font-bold transition cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL BOTTOM SHEET: HERRAMIENTAS Y TRANSPORTE EN MÓVIL */}
        {showMobileTools && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end md:hidden animate-in fade-in">
            <div className="bg-[#141620] border-t border-white/15 rounded-t-3xl p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={16} className="text-blue-400" /> Herramientas de Estudio
                </span>
                <button
                  onClick={() => setShowMobileTools(false)}
                  className="p-1 rounded-lg bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Metrónomo Mobile */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-zinc-300">Metrónomo</span>
                  <span className="text-xs font-mono font-bold text-amber-400">{metronomeBpm} BPM</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleMetronome}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 ${
                      metronomePlaying ? "bg-amber-500 text-black" : "bg-white/10 text-white"
                    }`}
                  >
                    {metronomePlaying ? <Pause size={12} /> : <Play size={12} />}
                    <span>{metronomePlaying ? "Pausar" : "Iniciar"}</span>
                  </button>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={metronomeBpm}
                    onChange={(e) => setMetronomeBpm(parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <button
                    onClick={handleTapTempo}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 text-xs font-mono text-white font-bold"
                  >
                    TAP
                  </button>
                </div>
              </div>

              {/* Fila de Herramientas Acústicas Rápidas */}
              <div className="grid grid-cols-2 gap-2">
                {/* Reverb */}
                <button
                  onClick={toggleReverb}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-mono font-semibold transition ${
                    reverbActive
                      ? "bg-purple-950/50 border-purple-500/50 text-purple-300"
                      : "bg-black/40 border-white/10 text-zinc-400"
                  }`}
                >
                  <Waves size={18} className={reverbActive ? "text-purple-400" : "text-zinc-500"} />
                  <span>Reverb: {reverbActive ? "ON" : "OFF"}</span>
                </button>

                {/* Modo Atril */}
                <button
                  onClick={toggleWakeLock}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-xs font-mono font-semibold transition ${
                    wakeLockActive
                      ? "bg-cyan-950/50 border-cyan-500/50 text-cyan-300"
                      : "bg-black/40 border-white/10 text-zinc-400"
                  }`}
                >
                  <Sun size={18} className={wakeLockActive ? "text-cyan-400" : "text-zinc-500"} />
                  <span>Modo Atril: {wakeLockActive ? "ON" : "OFF"}</span>
                </button>
              </div>

              {/* Afinador de Guitarra */}
              <button
                onClick={() => {
                  toggleGuitarTuner();
                  setShowMobileTools(false);
                }}
                className="w-full p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 text-amber-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Guitar size={16} />
                <span>Abrir Afinador de Guitarra Pro</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
