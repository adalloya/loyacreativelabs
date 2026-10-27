"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { detectPitchMcLeod, freqToPitchData, PitchData } from "@/lib/vocalEngine";
import PitchMonitorView from "@/components/PitchMonitorView";
import WarmupStudioView from "@/components/WarmupStudioView";
import RepertoireCoachView from "@/components/RepertoireCoachView";
import SessionRecorderView from "@/components/SessionRecorderView";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  Activity,
  Music,
  BookOpen,
  Disc,
  Mic,
  MicOff,
  Waves,
  ArrowLeft,
  Cloud,
  Sparkles,
} from "lucide-react";

type ActiveTab = "monitor" | "warmup" | "repertoire" | "recorder";

export default function VoxStudioApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("monitor");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchHistory, setPitchHistory] = useState<
    Array<{ midiFloat: number; clarity: number; timestamp: number }>
  >([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopMicrophone = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }
    setMediaStream(null);
    setIsListening(false);
    setCurrentPitch(null);
  }, [mediaStream]);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setMediaStream(stream);
      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      const updatePitch = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const { freq, clarity, rms } = detectPitchMcLeod(buffer, audioCtx.sampleRate);

        if (freq > 60 && freq < 1100 && clarity >= 0.65) {
          const data = freqToPitchData(freq, clarity, rms);
          setCurrentPitch(data);
          setPitchHistory((prev) => {
            const now = performance.now();
            const filtered = prev.filter((item) => now - item.timestamp < 5200);
            return [...filtered, { midiFloat: data.midiFloat, clarity: data.clarity, timestamp: now }];
          });
        } else {
          setCurrentPitch(null);
        }

        rafRef.current = requestAnimationFrame(updatePitch);
      };

      rafRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      alert("Permite el acceso al micrófono para activar el detector de afinación en tiempo real.");
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main className="min-h-screen px-3 sm:px-6 pt-3 pb-28 md:pb-10 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6">
      {/* Barra de Retorno y Estado del Ecosistema */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <Link
          href="/"
          className="flex items-center gap-1.5 hover:text-white transition group py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Loya Creative Lab</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-white/[0.05] px-2.5 py-1 rounded-full border border-white/10">
            <Cloud className={`w-3 h-3 ${isSupabaseConfigured ? "text-[#30D158]" : "text-amber-400"}`} />
            <span className="hidden sm:inline">Supabase:</span>
            <span className={isSupabaseConfigured ? "text-zinc-200" : "text-amber-300"}>
              {isSupabaseConfigured ? "Cloud" : "Local"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
            <Sparkles className="w-3 h-3 text-[#BF5AF2]" />
            <span className="hidden sm:inline">Gemini AI</span> Coach
          </div>
        </div>
      </div>

      {/* Top Header / Dynamic Island HUD para Mobile & Desktop */}
      <header className="apple-glass-pill rounded-full px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2 sticky top-2 z-50">
        {/* Identidad */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-[#0A84FF] via-[#BF5AF2] to-[#30D158] flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.5)] shrink-0">
            <Waves className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
              VoxStudio Pro
            </h1>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              Apple Vocal Coach • LRCLIB & UltraStar Ready
            </p>
          </div>
        </div>

        {/* Navegación Desktop (Oculta en móvil porque móvil usa Bottom Tab Bar estilo iOS) */}
        <nav className="hidden md:flex items-center gap-1 bg-black/50 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab("monitor")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "monitor" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Afinador Live</span>
          </button>

          <button
            onClick={() => setActiveTab("warmup")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "warmup" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Vocalizaciones</span>
          </button>

          <button
            onClick={() => setActiveTab("repertoire")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "repertoire" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Karaoke & Letras</span>
          </button>

          <button
            onClick={() => setActiveTab("recorder")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "recorder" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Bitácora A/B</span>
          </button>
        </nav>

        {/* Píldora en Vivo estilo Dynamic Island (Siempre visible en móvil y desktop) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                !isListening
                  ? "bg-zinc-600"
                  : currentPitch && Math.abs(currentPitch.cents) <= 15
                  ? "bg-[#30D158] shadow-[0_0_8px_#30D158]"
                  : "bg-[#0A84FF]"
              }`}
            />
            <span className="font-bold text-white">
              {currentPitch ? currentPitch.noteName : isListening ? "..." : "OFF"}
            </span>
            {currentPitch && (
              <span
                className={`text-[10px] ${
                  Math.abs(currentPitch.cents) <= 15 ? "text-[#30D158]" : "text-amber-400"
                }`}
              >
                {currentPitch.cents > 0 ? `+${currentPitch.cents}c` : `${currentPitch.cents}c`}
              </span>
            )}
          </div>

          <button
            onClick={handleToggleMic}
            className={`p-2.5 rounded-full transition-all border cursor-pointer ${
              isListening
                ? "bg-[#30D158] text-black border-[#30D158] shadow-[0_0_18px_rgba(48,209,88,0.45)]"
                : "bg-[#0A84FF] text-white border-[#0A84FF]/50 shadow-[0_0_15px_rgba(10,132,255,0.4)]"
            }`}
            aria-label="Alternar micrófono"
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Vista Activa */}
      <section className="flex-1">
        {activeTab === "monitor" && (
          <PitchMonitorView
            isListening={isListening}
            onToggleMic={handleToggleMic}
            currentPitch={currentPitch}
            pitchHistory={pitchHistory}
          />
        )}

        {activeTab === "warmup" && (
          <WarmupStudioView
            currentPitch={currentPitch}
            isListening={isListening}
            onToggleMic={handleToggleMic}
          />
        )}

        {activeTab === "repertoire" && <RepertoireCoachView currentPitch={currentPitch} />}

        {activeTab === "recorder" && (
          <SessionRecorderView
            currentPitch={currentPitch}
            mediaStream={mediaStream}
            isListening={isListening}
            onToggleMic={handleToggleMic}
          />
        )}
      </section>

      {/* Bottom Tab Bar Flotante exclusiva para Mobile (iOS 18 Liquid Glass Dock) */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 apple-glass-pill rounded-3xl p-1.5 grid grid-cols-4 gap-1 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
        <button
          onClick={() => setActiveTab("monitor")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "monitor"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[10px]">Afinador</span>
        </button>

        <button
          onClick={() => setActiveTab("warmup")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "warmup"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Music className="w-4 h-4" />
          <span className="text-[10px]">Escalas</span>
        </button>

        <button
          onClick={() => setActiveTab("repertoire")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "repertoire"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px]">Karaoke LRC</span>
        </button>

        <button
          onClick={() => setActiveTab("recorder")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "recorder"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Disc className="w-4 h-4" />
          <span className="text-[10px]">Grabadora</span>
        </button>
      </nav>
    </main>
  );
}
