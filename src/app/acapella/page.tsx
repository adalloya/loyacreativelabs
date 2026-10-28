"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { detectPitchMcLeod, freqToPitchData, PitchData, SOLFEGE_NAMES, NOTE_NAMES } from "@/lib/vocalEngine";
import PitchMonitorView from "@/components/PitchMonitorView";
import WarmupStudioView from "@/components/WarmupStudioView";
import RepertoireCoachView from "@/components/RepertoireCoachView";
import SessionRecorderView from "@/components/SessionRecorderView";
import LessonsAcademyView from "@/components/LessonsAcademyView";
import VocalProfileModal, { UserVocalProfile } from "@/components/VocalProfileModal";
import StudioToolsModal from "@/components/StudioToolsModal";
import GuitarTunerModal from "@/components/GuitarTunerModal";
import VocalTrainerSuite from "@/components/VocalTrainerSuite";
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
  Sliders,
  Database,
  GraduationCap,
  Guitar,
} from "lucide-react";

type ActiveTab = "monitor" | "warmup" | "lessons" | "repertoire" | "recorder";

const DEFAULT_PROFILE: UserVocalProfile = {
  lowestMidi: 45, // A2
  highestMidi: 64, // E4
  passaggioMidi: 62, // D4
  voiceType: "Barítono / Tenor Ligero",
};

// Generador sintético de respuesta al impulso acústico para Reverb de sala de concierto
function createConcertHallReverb(ctx: AudioContext, duration = 2.4, decay = 2.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const factor = Math.pow((length - i) / length, decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

export default function VoxStudioApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("monitor");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchHistory, setPitchHistory] = useState<
    Array<{ midiFloat: number; clarity: number; timestamp: number }>
  >([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Perfil Vocal Persistente y Wake Lock (Modo Atril)
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [isGuitarTunerOpen, setIsGuitarTunerOpen] = useState<boolean>(false);
  const [isCoachModalOpen, setIsCoachModalOpen] = useState<boolean>(false);
  const [warmupMode, setWarmupMode] = useState<"suite" | "scales">("suite");
  const [vocalProfile, setVocalProfile] = useState<UserVocalProfile>(DEFAULT_PROFILE);
  const [wakeLockEnabled, setWakeLockEnabled] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<{ release: () => Promise<void> } | null>(null);

  // Reverb de Monitoreo en Tiempo Real
  const [isMonitoringReverb, setIsMonitoringReverb] = useState<boolean>(false);
  const reverbGainRef = useRef<GainNode | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Cargar perfil vocal guardado en localStorage al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem("voxstudio_vocal_profile");
      if (saved) {
        setVocalProfile(JSON.parse(saved));
      }
    } catch {
      // Ignorar errores de almacenamiento privado
    }
  }, []);

  const handleUpdateProfile = (newProf: UserVocalProfile) => {
    setVocalProfile(newProf);
    try {
      localStorage.setItem("voxstudio_vocal_profile", JSON.stringify(newProf));
    } catch {
      // Ignorar
    }
  };

  // Alternar Reverb de Monitoreo
  const handleToggleReverb = () => {
    const nextState = !isMonitoringReverb;
    setIsMonitoringReverb(nextState);
    if (reverbGainRef.current && audioCtxRef.current) {
      reverbGainRef.current.gain.setValueAtTime(
        nextState ? 0.35 : 0,
        audioCtxRef.current.currentTime
      );
    }
  };

  // Controlar Screen Wake Lock para que no se apague el celular al cantar
  const handleToggleWakeLock = async () => {
    if (wakeLockEnabled) {
      if (wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
      }
      setWakeLockEnabled(false);
    } else {
      try {
        if ("wakeLock" in navigator) {
          const navWithWake = navigator as unknown as {
            wakeLock: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
          };
          wakeLockSentinelRef.current = await navWithWake.wakeLock.request("screen");
          setWakeLockEnabled(true);
        } else {
          setWakeLockEnabled(true);
        }
      } catch {
        setWakeLockEnabled(true);
      }
    }
  };

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
    reverbGainRef.current = null;
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

      // Crear Reverb espacial por convolución para monitoreo vocal con audífonos
      try {
        const convolver = audioCtx.createConvolver();
        convolver.buffer = createConcertHallReverb(audioCtx, 2.2, 2.0);
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.setValueAtTime(isMonitoringReverb ? 0.35 : 0, audioCtx.currentTime);

        source.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        reverbGainRef.current = reverbGain;
      } catch (revErr) {
        console.warn("[VoxStudio] Reverb setup skipped:", revErr);
      }

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      setMediaStream(stream);
      setIsListening(true);

      const buffer = new Float32Array(analyser.fftSize);

      let lastValidPitch: PitchData | null = null;
      let lastValidTime = 0;
      let stableNoteMidi: number | null = null;
      let candidateMidi: number | null = null;
      let candidateFirstSeen = 0;
      let lastHistoryPush = 0;
      let smoothedFreq = 0;

      const updatePitch = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const { freq, clarity, rms } = detectPitchMcLeod(buffer, audioCtx.sampleRate);
        const now = performance.now();

        if (freq > 62 && freq < 1050 && clarity >= 0.63) {
          // Suavizado exponencial ligero de frecuencia para eliminar micro-jitter
          if (smoothedFreq === 0 || Math.abs(freq - smoothedFreq) > 35) {
            smoothedFreq = freq;
          } else {
            smoothedFreq = smoothedFreq * 0.7 + freq * 0.3;
          }

          const rawData = freqToPitchData(smoothedFreq, clarity, rms);

          // Estabilizador temporal de nota (Hysteresis & Note-Switch Delay ~125ms):
          // Si el cantante cambia de nota, exigimos que se mantenga por al menos 125ms
          // antes de cambiar el texto de la nota para no parpadear con el vibrato
          if (stableNoteMidi === null) {
            stableNoteMidi = rawData.midi;
            candidateMidi = rawData.midi;
            candidateFirstSeen = now;
          } else if (rawData.midi !== stableNoteMidi) {
            if (candidateMidi !== rawData.midi) {
              candidateMidi = rawData.midi;
              candidateFirstSeen = now;
            } else if (now - candidateFirstSeen >= 125) {
              stableNoteMidi = rawData.midi;
            }
          } else {
            candidateMidi = rawData.midi;
            candidateFirstSeen = now;
          }

          // Armar datos con la nota estable si el candidato aún no vence el delay
          let finalData = rawData;
          if (stableNoteMidi !== null && stableNoteMidi !== rawData.midi) {
            const stableFreq = 440 * Math.pow(2, (stableNoteMidi - 69) / 12);
            const stableCents = Math.round(1200 * Math.log2(smoothedFreq / stableFreq));
            if (Math.abs(stableCents) <= 65) {
              const noteIndex = ((stableNoteMidi % 12) + 12) % 12;
              const octave = Math.floor(stableNoteMidi / 12) - 1;
              finalData = {
                ...rawData,
                midi: stableNoteMidi,
                noteName: `${SOLFEGE_NAMES[noteIndex]}${octave}`,
                noteLetter: SOLFEGE_NAMES[noteIndex],
                angloName: `${NOTE_NAMES[noteIndex]}${octave}`,
                angloLetter: NOTE_NAMES[noteIndex],
                octave,
                cents: stableCents,
              };
            }
          }

          lastValidPitch = finalData;
          lastValidTime = now;
          setCurrentPitch(finalData);

          // Muestreo controlado a ~30 FPS para la gráfica de registro (evita sobrecarga y trazo brusco)
          if (now - lastHistoryPush >= 32) {
            lastHistoryPush = now;
            setPitchHistory((prev) => {
              // Ventana de 8.2 segundos para una visualización relajada y fácil de seguir
              const filtered = prev.filter((item) => now - item.timestamp < 8200);
              return [...filtered, { midiFloat: rawData.midiFloat, clarity: rawData.clarity, timestamp: now }];
            });
          }
        } else {
          // Ventana de gracia de silencio (~260ms):
          // Durante consonantes o pausas cortas de respiración, mantenemos la nota para evitar parpadeos
          if (lastValidPitch && now - lastValidTime < 260) {
            // Se mantiene el último tono en pantalla
          } else {
            lastValidPitch = null;
            stableNoteMidi = null;
            candidateMidi = null;
            smoothedFreq = 0;
            setCurrentPitch(null);
          }
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
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  const handleTabChange = (newTab: ActiveTab) => {
    setActiveTab(newTab);
    // Si cambiamos a Karaoke o Academia, pausamos el micrófono para que no interfiera ni se acople con la música
    if ((newTab === "repertoire" || newTab === "lessons") && isListening) {
      stopMicrophone();
    }
  };

  const handleCloseGuitarTuner = () => {
    setIsGuitarTunerOpen(false);
    if (activeTab !== "monitor" && isListening) {
      stopMicrophone();
    }
  };

  return (
    <main className="min-h-screen px-3 sm:px-6 pt-3 pb-28 md:pb-10 max-w-7xl mx-auto flex flex-col gap-3.5 sm:gap-5">
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
      <header className="apple-glass-pill rounded-full px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2 sticky top-2 z-40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.35)] shrink-0 p-1">
            <Image
              src="/acapella-logo.png"
              alt="Acapella Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
              Acapella
            </h1>
            <p className="text-[10px] text-zinc-400 hidden sm:block">
              {vocalProfile.voiceType} ({vocalProfile.lowestMidi}–{vocalProfile.highestMidi} MIDI)
            </p>
          </div>
        </div>

        {/* Navegación Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-black/50 p-1 rounded-full border border-white/10">
          <button
            onClick={() => handleTabChange("monitor")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "monitor" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Afinador Live</span>
          </button>

          <button
            onClick={() => handleTabChange("warmup")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "warmup" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Vocalizaciones</span>
          </button>

          <button
            onClick={() => handleTabChange("lessons")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "lessons" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academia</span>
          </button>

          <button
            onClick={() => handleTabChange("repertoire")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "repertoire" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Karaoke & Letras</span>
          </button>

          <button
            onClick={() => handleTabChange("recorder")}
            className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "recorder" ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Bitácora A/B</span>
          </button>
        </nav>

        {/* Botones de Herramientas Studio, Guitarra y Perfil Vocal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsCoachModalOpen(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#0A84FF] border border-white/10 transition cursor-pointer"
            title="Vocal Coach Suite: Escalas, Respiración 4-4-8 y Cuerda Acapella"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsGuitarTunerOpen(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#30D158] border border-white/10 transition cursor-pointer"
            title="Afinador de Guitarra Pro (Estándar & Drop D)"
          >
            <Guitar className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsToolsOpen(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-[#BF5AF2] border border-white/10 transition cursor-pointer"
            title="Herramientas Pro: Backup JSON, Reverb de Monitoreo y Diagnóstico IA"
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition cursor-pointer"
            title="Calibrar Rango Vocal, Metrónomo y Modo Atril"
          >
            <Sliders className="w-4 h-4" />
          </button>

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
          <div className="flex flex-col gap-6">
            {/* Selector de Modo de Vocalización */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-1 bg-black/60 p-1.5 rounded-full border border-white/10 text-xs font-semibold">
                <button
                  onClick={() => setWarmupMode("suite")}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    warmupMode === "suite"
                      ? "bg-white text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0A84FF]" />
                  <span>Vocal Coach Suite (5 Motores)</span>
                </button>
                <button
                  onClick={() => setWarmupMode("scales")}
                  className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    warmupMode === "scales"
                      ? "bg-white text-black shadow-md font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>Escalador de Semitonos</span>
                </button>
              </div>
            </div>

            {warmupMode === "suite" ? (
              <VocalTrainerSuite
                vocalProfile={vocalProfile}
                onUpdateProfile={handleUpdateProfile}
              />
            ) : (
              <WarmupStudioView
                currentPitch={currentPitch}
                isListening={isListening}
                onToggleMic={handleToggleMic}
              />
            )}
          </div>
        )}

        {activeTab === "lessons" && <LessonsAcademyView />}

        {activeTab === "repertoire" && (
          <RepertoireCoachView
            currentPitch={currentPitch}
            isListening={isListening}
            onToggleMic={handleToggleMic}
          />
        )}

        {activeTab === "recorder" && (
          <SessionRecorderView
            currentPitch={currentPitch}
            mediaStream={mediaStream}
            isListening={isListening}
            onToggleMic={handleToggleMic}
          />
        )}
      </section>

      {/* Modal de Calibración de Tesitura, Metrónomo y Pantalla Activa */}
      <VocalProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentPitch={currentPitch}
        isListening={isListening}
        onToggleMic={handleToggleMic}
        profile={vocalProfile}
        onUpdateProfile={handleUpdateProfile}
        wakeLockEnabled={wakeLockEnabled}
        onToggleWakeLock={handleToggleWakeLock}
      />

      {/* Modal de Herramientas Pro: Backup JSON, Diagnóstico IA y Reverb de Monitoreo */}
      <StudioToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        isMonitoringReverb={isMonitoringReverb}
        onToggleReverb={handleToggleReverb}
      />

      {/* Modal de Afinador de Guitarra Pro */}
      <GuitarTunerModal
        isOpen={isGuitarTunerOpen}
        onClose={handleCloseGuitarTuner}
        currentPitch={currentPitch}
        isListening={isListening}
        onToggleMic={handleToggleMic}
      />

      {/* Modal Independiente de Vocal Coach Suite */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="relative w-full max-w-5xl">
            <VocalTrainerSuite
              vocalProfile={vocalProfile}
              onUpdateProfile={handleUpdateProfile}
              isModal={true}
              onClose={() => setIsCoachModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Bottom Tab Bar Flotante exclusiva para Mobile */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 apple-glass-pill rounded-3xl p-1.5 grid grid-cols-5 gap-1 border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
        <button
          onClick={() => handleTabChange("monitor")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "monitor"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="text-[9px]">Afinador</span>
        </button>

        <button
          onClick={() => handleTabChange("warmup")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "warmup"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Music className="w-4 h-4" />
          <span className="text-[9px]">Escalas</span>
        </button>

        <button
          onClick={() => handleTabChange("lessons")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "lessons"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span className="text-[9px]">Academia</span>
        </button>

        <button
          onClick={() => handleTabChange("repertoire")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "repertoire"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9px]">Karaoke</span>
        </button>

        <button
          onClick={() => handleTabChange("recorder")}
          className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeTab === "recorder"
              ? "bg-white text-black font-bold shadow-sm"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <Disc className="w-4 h-4" />
          <span className="text-[9px]">Bitácora</span>
        </button>
      </nav>
    </main>
  );
}
