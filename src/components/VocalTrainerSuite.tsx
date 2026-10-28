"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SOLFEGE_NAMES,
  NOTE_NAMES,
  midiToNoteName as engineMidiToNoteName,
} from "@/lib/vocalEngine";
import { UserVocalProfile } from "@/components/VocalProfileModal";
import {
  Mic,
  MicOff,
  Play,
  Square,
  Award,
  Volume2,
  Wind,
  Sparkles,
  RotateCcw,
  Disc,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Music2,
  Activity,
  Layers,
  Sparkle,
  X,
} from "lucide-react";

// ==========================================
// 1. CONSTANTES Y TIPOS MUSICALES
// ==========================================
export interface PitchData {
  frequency: number;
  note: string;
  anglo: string;
  octave: number;
  cents: number; // Desviación de -50 a +50
  midi: number;
}

export interface VocalExercise {
  id: string;
  category: "warmup" | "resonance" | "agility" | "cooldown";
  categoryLabel: string;
  title: string;
  phonetic: string;
  description: string;
  intervals: number[]; // Semitonos relativos a la nota base
  tempoBpm: number;
}

export const VOCAL_EXERCISES: VocalExercise[] = [
  {
    id: "lip-trill-5th",
    category: "warmup",
    categoryLabel: "Calentamiento",
    title: "Lip Trills (Deslizamiento de 5ta)",
    phonetic: "Brrrr... continuo",
    description: "Relaja los labios y deja fluir el aire constante sin apretar la laringe ni el cuello.",
    intervals: [0, 2, 4, 5, 7, 5, 4, 2, 0],
    tempoBpm: 110,
  },
  {
    id: "humming-triad",
    category: "resonance",
    categoryLabel: "Resonancia",
    title: "Resonancia en Máscara (Humming)",
    phonetic: "Mmmm - Ma - Me - Mi",
    description: "Siente la vibración en los pómulos y la nariz con los dientes ligeramente separados.",
    intervals: [0, 4, 7, 4, 0],
    tempoBpm: 95,
  },
  {
    id: "staccato-arpeggio",
    category: "agility",
    categoryLabel: "Agilidad",
    title: "Rebote Diafragmático (Staccato)",
    phonetic: "Ja - Ja - Ja - Ja",
    description: "Notas cortas y precisas impulsadas desde el abdomen bajo, sin golpe de glotis brusco.",
    intervals: [0, 4, 7, 12, 7, 4, 0],
    tempoBpm: 120,
  },
  {
    id: "octave-siren",
    category: "warmup",
    categoryLabel: "Puente Vocal",
    title: "Sirena de Passaggio (Octava)",
    phonetic: "Ng... o Uuuu...",
    description: "Conecta tu voz de pecho con voz de cabeza de forma fluida sin que se quiebre el sonido.",
    intervals: [0, 12, 0],
    tempoBpm: 75,
  },
  {
    id: "cooldown-sigh",
    category: "cooldown",
    categoryLabel: "Descompresión",
    title: "Descenso y Relajación Cordal",
    phonetic: "Suu - Saa (Suspiro suave)",
    description: "Volumen bajo y aireado para relajar la musculatura laríngea tras la sesión de canto.",
    intervals: [7, 5, 4, 2, 0],
    tempoBpm: 80,
  },
];

// Convierte frecuencia (Hz) a datos de afinación con Sistema Solfeo (Do-Re-Mi) y Anglosajón
export function frequencyToPitchData(frequency: number): PitchData {
  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const midi = Math.round(noteNum) + 69;
  const standardFreq = 440 * Math.pow(2, (midi - 69) / 12);
  const cents = Math.floor(1200 * Math.log2(frequency / standardFreq));
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const note = SOLFEGE_NAMES[noteIndex];
  const anglo = NOTE_NAMES[noteIndex];

  return {
    frequency: Math.round(frequency * 10) / 10,
    note,
    anglo,
    octave,
    cents,
    midi,
  };
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getAcapellaVoiceSuggestion(lowestMidi: number, highestMidi: number): {
  partName: string;
  description: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  suitableTracks: string[];
} {
  const center = (lowestMidi + highestMidi) / 2;
  if (center < 48) {
    return {
      partName: "Bajo (Bass)",
      description: "Profundidad, resonancia pectoral y peso acústico. Eres el cimiento armónico del grupo acapella.",
      badgeBg: "rgba(10, 132, 255, 0.15)",
      textColor: "#64D2FF",
      borderColor: "rgba(10, 132, 255, 0.35)",
      suitableTracks: ["Línea de Bajo (Bassline)", "Raíces de los Acordes", "Bajo Rítmico"],
    };
  } else if (center < 55) {
    return {
      partName: "Barítono (Baritone)",
      description: "Rango medio versátil y cálido. Acomoda tanto la melodía líder como las terceras y quintas corales.",
      badgeBg: "rgba(48, 209, 88, 0.15)",
      textColor: "#30D158",
      borderColor: "rgba(48, 209, 88, 0.35)",
      suitableTracks: ["Voz Principal Masculina", "Armonías Medias (3ras y 5tas)", "Relleno Coral"],
    };
  } else if (center < 62) {
    return {
      partName: "Tenor (Tenor)",
      description: "Gran proyección en agudos y facilidad en zona de puente (passaggio). Ideal para melodías pop y coros altos.",
      badgeBg: "rgba(255, 214, 10, 0.15)",
      textColor: "#FFD60A",
      borderColor: "rgba(255, 214, 10, 0.35)",
      suitableTracks: ["Lead Vocal Melódico", "Contracantos Altos", "Segundas Voces Superiores"],
    };
  } else if (center < 67) {
    return {
      partName: "Contralto / Mezzosoprano",
      description: "Timbre femenino aterciopelado y sólido en graves y medios. Da riqueza y textura armónica al ensamble.",
      badgeBg: "rgba(191, 90, 242, 0.15)",
      textColor: "#BF5AF2",
      borderColor: "rgba(191, 90, 242, 0.35)",
      suitableTracks: ["Contralto Melódico", "Duetos", "Centro Armónico del Coro"],
    };
  } else {
    return {
      partName: "Soprano (Soprano)",
      description: "Brillo, agilidad y soltura en agudos. Destaca en la cúspide melódica, falsetes y ornamentos vocales.",
      badgeBg: "rgba(255, 69, 58, 0.15)",
      textColor: "#FF453A",
      borderColor: "rgba(255, 69, 58, 0.35)",
      suitableTracks: ["Línea Melódica Superior", "Ad-libs & Agudos", "Voces Principales Femeninas"],
    };
  }
}

// ==========================================
// 2. ALGORITMO DE AUTOCORRELACIÓN NORMALIZADA
// ==========================================
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let size = buffer.length;
  let rms = 0;

  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / size);

  // Puerta de ruido (Noise Gate): silenciar ruidos de ambiente
  if (rms < 0.012) return -1;

  let r1 = 0;
  let r2 = size - 1;
  const thres = 0.2;

  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) < thres) {
      r2 = size - i;
      break;
    }
  }

  const trimmedBuffer = buffer.slice(r1, r2);
  size = trimmedBuffer.length;
  if (size < 64) return -1;

  const c = new Float32Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] = c[i] + trimmedBuffer[j] * trimmedBuffer[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
    if (d >= size) return -1;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  // Filtrar frecuencias fuera del rango vocal humano (aprox 65Hz C2 a 1100Hz C#6)
  if (freq < 65 || freq > 1100) return -1;

  return freq;
}

// ==========================================
// 3. COMPONENTE PRINCIPAL VOCAL TRAINER SUITE
// ==========================================
interface VocalTrainerSuiteProps {
  vocalProfile?: UserVocalProfile;
  onUpdateProfile?: (newProf: UserVocalProfile) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export default function VocalTrainerSuite({
  vocalProfile,
  onUpdateProfile,
  isModal = false,
  onClose,
}: VocalTrainerSuiteProps) {
  // Estados de Navegación
  const [activeTab, setActiveTab] = useState<"exercises" | "breathing" | "range">("exercises");
  const [selectedExercise, setSelectedExercise] = useState<VocalExercise>(VOCAL_EXERCISES[0]);
  const [rootMidi, setRootMidi] = useState<number>(vocalProfile?.lowestMidi ? vocalProfile.lowestMidi + 5 : 48); // Do3 por defecto
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [activeNoteMidi, setActiveNoteMidi] = useState<number | null>(null);

  // Estados del Detector de Afinación y Micrófono
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [accuracyScore, setAccuracyScore] = useState<number>(0);

  // Estados para Rango Vocal y Cuerda Acapella
  const [lowestMidi, setLowestMidi] = useState<number | null>(vocalProfile?.lowestMidi || null);
  const [highestMidi, setHighestMidi] = useState<number | null>(vocalProfile?.highestMidi || null);

  // Estados de Grabadora de Práctica Instantánea
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Estados del Temporizador de Respiración Costo-Diafragmática (4 - 4 - 8)
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<"Inhala" | "Retén" | "Exhala (Ssss)">("Inhala");
  const [breathSeconds, setBreathSeconds] = useState<number>(4);

  // Referencias de Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const sequenceCancelRef = useRef<boolean>(false);

  // Inicializar AudioContext bajo demanda
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // ==========================================
  // MOTOR DE DETECCIÓN DE VOZ + GRABADORA
  // ==========================================
  const startMicrophone = async () => {
    try {
      const ctx = getAudioContext();
      // Importante: echoCancellation: false y noiseSuppression: false para no cortar armónicos vocales
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          autoGainControl: false,
          noiseSuppression: false,
        },
      });

      mediaStreamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      updatePitchLoop();
    } catch (err) {
      console.error("Error al acceder al micrófono en VocalTrainerSuite:", err);
      alert("Permite el acceso al micrófono para activar el detector biomecánico de afinación.");
    }
  };

  const stopMicrophone = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
    setCurrentPitch(null);
  }, []);

  const updatePitchLoop = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    const buffer = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buffer);

    const freq = autoCorrelate(buffer, audioCtxRef.current.sampleRate);
    if (freq !== -1) {
      const pitch = frequencyToPitchData(freq);
      setCurrentPitch(pitch);

      // Actualizar rango vocal detectado en vivo
      setLowestMidi((prev) => (prev === null || pitch.midi < prev ? pitch.midi : prev));
      setHighestMidi((prev) => (prev === null || pitch.midi > prev ? pitch.midi : prev));
    }

    rafIdRef.current = requestAnimationFrame(updatePitchLoop);
  };

  // Evaluar precisión si hay una nota guía sonando
  useEffect(() => {
    if (activeNoteMidi && currentPitch) {
      const isSameNote = currentPitch.midi === activeNoteMidi;
      const centsPrecision = Math.max(0, 100 - Math.abs(currentPitch.cents) * 2);
      if (isSameNote) {
        setAccuracyScore((prev) => Math.round(prev * 0.7 + centsPrecision * 0.3));
      }
    }
  }, [currentPitch, activeNoteMidi]);

  // Grabación de práctica para autoevaluación
  const toggleRecording = () => {
    if (!isListening || !mediaStreamRef.current) return;

    if (!isRecording) {
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  // ==========================================
  // SINTETIZADOR DE TONOS GUÍA CON ENVOLVENTE ADSR
  // ==========================================
  const playReferenceTone = (midi: number, durationSec: number): Promise<void> => {
    return new Promise((resolve) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = midiToFrequency(midi);
      osc.type = "triangle"; // Timbre cálido y natural tipo piano eléctrico
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Envolvente suave (ADSR) para evitar chasquidos acústicos
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      subOsc.start();
      osc.stop(ctx.currentTime + durationSec);
      subOsc.stop(ctx.currentTime + durationSec);

      setTimeout(resolve, durationSec * 1000);
    });
  };

  const runExerciseSequence = async () => {
    if (isPlayingSequence) {
      sequenceCancelRef.current = true;
      setIsPlayingSequence(false);
      setActiveNoteMidi(null);
      return;
    }

    sequenceCancelRef.current = false;
    setIsPlayingSequence(true);
    setAccuracyScore(0);

    const stepDurationSec = 60 / selectedExercise.tempoBpm;

    for (const interval of selectedExercise.intervals) {
      if (sequenceCancelRef.current) break;
      const targetMidi = rootMidi + interval;
      setActiveNoteMidi(targetMidi);
      await playReferenceTone(targetMidi, stepDurationSec);
    }

    setActiveNoteMidi(null);
    setIsPlayingSequence(false);
  };

  // ==========================================
  // TEMPORIZADOR DE RESPIRACIÓN (4 - 4 - 8)
  // ==========================================
  useEffect(() => {
    if (!breathingActive) return;

    const timer = setInterval(() => {
      setBreathSeconds((prev) => {
        if (prev > 1) return prev - 1;

        setBreathPhase((currentPhase) => {
          if (currentPhase === "Inhala") {
            setBreathSeconds(4);
            return "Retén";
          } else if (currentPhase === "Retén") {
            setBreathSeconds(8);
            return "Exhala (Ssss)";
          } else {
            setBreathSeconds(4);
            return "Inhala";
          }
        });
        return 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [breathingActive]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      stopMicrophone();
      sequenceCancelRef.current = true;
    };
  }, [stopMicrophone]);

  // Sugerencia de cuerda vocal para multipistas de acapella
  const voiceSuggestion = lowestMidi && highestMidi ? getAcapellaVoiceSuggestion(lowestMidi, highestMidi) : null;

  const handleApplyToProfile = () => {
    if (!lowestMidi || !highestMidi || !onUpdateProfile) return;
    const center = (lowestMidi + highestMidi) / 2;
    const passaggio = Math.round(center + 3);
    const suggestion = getAcapellaVoiceSuggestion(lowestMidi, highestMidi);
    onUpdateProfile({
      lowestMidi,
      highestMidi,
      passaggioMidi: passaggio,
      voiceType: suggestion.partName,
    });
    alert(`¡Perfil Acapella Actualizado! Cuerda vocal asignada: ${suggestion.partName}`);
  };

  return (
    <div
      className={`w-full max-w-5xl mx-auto flex flex-col gap-6 font-sans ${
        isModal
          ? "p-6 apple-glass rounded-3xl border border-white/15 max-h-[92vh] overflow-y-auto"
          : "p-4 sm:p-6"
      }`}
    >
      {/* HEADER DE LA SUITE */}
      <div className="apple-glass rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 mt-0.5">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Vocal Studio Coach Suite
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30">
                5 Motores Nativos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Entrenamiento biomecánico, afinación en solfeo, control diafragmático y calibración de cuerda acapella
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={isListening ? stopMicrophone : startMicrophone}
            className={`px-4 py-2.5 rounded-2xl font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              isListening
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-[#0A84FF] text-white shadow-[0_0_20px_rgba(10,132,255,0.4)] hover:bg-[#0070E0]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isListening ? "bg-red-400 animate-ping" : "bg-white"
              }`}
            />
            {isListening ? "Detener Micrófono" : "Activar Micrófono DSP"}
          </button>

          {isListening && (
            <button
              onClick={toggleRecording}
              className={`px-4 py-2.5 rounded-2xl font-semibold text-xs border transition-all flex items-center gap-2 cursor-pointer ${
                isRecording
                  ? "bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
                  : "bg-white/10 border-white/15 text-zinc-200 hover:bg-white/15"
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              {isRecording ? "Detener Grabación" : "Grabar Práctica"}
            </button>
          )}

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MONITOR DE AFINACIÓN Y TOMA RECIENTE */}
      <div className="apple-glass rounded-3xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 w-full md:w-auto">
          {/* Nota Gigante en Solfeo */}
          <div className="w-22 h-22 rounded-3xl bg-black/60 border border-white/15 flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                currentPitch && Math.abs(currentPitch.cents) <= 12
                  ? "text-[#30D158] drop-shadow-[0_0_15px_rgba(48,209,88,0.4)]"
                  : "text-white"
              }`}
            >
              {currentPitch ? `${currentPitch.note}${currentPitch.octave}` : "—"}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {currentPitch ? `${currentPitch.frequency} Hz (${currentPitch.anglo}${currentPitch.octave})` : "Esperando voz"}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
              <span>Desviación en Cents</span>
              {currentPitch && (
                <span
                  className={
                    Math.abs(currentPitch.cents) <= 12 ? "text-[#30D158]" : "text-amber-400"
                  }
                >
                  {currentPitch.cents > 0 ? `+${currentPitch.cents}c` : `${currentPitch.cents}c`}
                </span>
              )}
            </div>

            {/* Medidor horizontal de aguja */}
            <div className="w-full sm:w-80 h-3 bg-zinc-950 rounded-full overflow-hidden relative border border-white/10">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#30D158] z-10 shadow-[0_0_6px_#30D158]" />
              {currentPitch && (
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    Math.abs(currentPitch.cents) <= 12 ? "bg-[#30D158]" : "bg-amber-400"
                  }`}
                  style={{
                    width: "8px",
                    marginLeft: `${Math.min(95, Math.max(5, 50 + currentPitch.cents))}%`,
                  }}
                />
              )}
            </div>

            <div className="flex justify-between text-[10px] text-zinc-500 mt-1 sm:w-80 font-medium">
              <span>-50c (Bajo)</span>
              <span className="text-[#30D158]">Centro Exacto</span>
              <span>+50c (Alto)</span>
            </div>
          </div>
        </div>

        {/* Nota Guía y Reproductor de Toma */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {activeNoteMidi && (
            <div className="px-4 py-2.5 rounded-2xl bg-[#30D158]/15 border border-[#30D158]/40 text-center">
              <span className="block text-[10px] uppercase font-bold text-[#30D158]">Nota Guía Activa</span>
              <span className="text-xl font-extrabold text-white">
                {engineMidiToNoteName(activeNoteMidi, "both")}
              </span>
            </div>
          )}

          {recordedAudioUrl && (
            <div className="p-3 rounded-2xl bg-black/50 border border-white/10 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                <Disc className="w-3.5 h-3.5 text-amber-400" />
                <span>Tu última toma de práctica:</span>
              </div>
              <audio src={recordedAudioUrl} controls className="h-8 w-48 sm:w-56" />
            </div>
          )}
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10 w-fit">
        {[
          { id: "exercises", label: "Rutinas y Escalas", icon: Music2 },
          { id: "breathing", label: "Respiración Diafragmática (4-4-8)", icon: Wind },
          { id: "range", label: "Detector de Rango & Cuerda Acapella", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-black shadow-md"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MÓDULO 1: RUTINAS Y ESCALAS */}
      {activeTab === "exercises" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista de Ejercicios */}
          <div className="lg:col-span-4 flex flex-col gap-2.5">
            {VOCAL_EXERCISES.map((ex) => {
              const isSelected = selectedExercise.id === ex.id;
              return (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExercise(ex)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0A84FF]/20 border-[#0A84FF]/50 text-white shadow-[0_0_20px_rgba(10,132,255,0.25)]"
                      : "bg-black/40 border-white/10 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A84FF]">
                      {ex.categoryLabel}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{ex.tempoBpm} BPM</span>
                  </div>
                  <div className="font-bold text-sm text-white">{ex.title}</div>
                  <div className="text-xs text-zinc-400 mt-1 font-mono">Fonética: {ex.phonetic}</div>
                </button>
              );
            })}
          </div>

          {/* Consola Interactiva del Ejercicio */}
          <div className="lg:col-span-8 apple-glass rounded-3xl p-6 sm:p-7 border border-white/10 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-semibold text-zinc-200">
                  Fonética Sugerida: {selectedExercise.phonetic}
                </span>
                <span className="text-xs text-zinc-400">Tempo: {selectedExercise.tempoBpm} BPM</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {selectedExercise.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 mb-6 leading-relaxed">
                {selectedExercise.description}
              </p>

              {/* Peldaños Interactivos de la Escala */}
              <div className="flex items-center gap-2 flex-wrap mb-6">
                {selectedExercise.intervals.map((interval, idx) => {
                  const noteMidi = rootMidi + interval;
                  const isCurrent = activeNoteMidi === noteMidi;
                  return (
                    <button
                      key={idx}
                      onClick={() => playReferenceTone(noteMidi, 0.7)}
                      className={`w-14 h-16 rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#30D158] text-black border-[#30D158] font-bold scale-105 shadow-[0_0_20px_rgba(48,209,88,0.5)]"
                          : "bg-black/60 border-white/10 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold">{engineMidiToNoteName(noteMidi, "solfege")}</span>
                      <span className="text-[9px] opacity-70 font-mono">+{interval}st</span>
                      <Volume2 className="w-3 h-3 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controles de Tono Base y Botón de Inicio */}
            <div className="pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-semibold">Tono Base:</span>
                <button
                  onClick={() => setRootMidi((prev) => Math.max(36, prev - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer font-medium"
                >
                  -1 Semitono
                </button>
                <span className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/15 font-bold text-sm text-[#0A84FF]">
                  {engineMidiToNoteName(rootMidi, "both")}
                </span>
                <button
                  onClick={() => setRootMidi((prev) => Math.min(72, prev + 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer font-medium"
                >
                  +1 Semitono
                </button>
              </div>

              <div className="flex items-center gap-3">
                {accuracyScore > 0 && (
                  <span className="text-xs font-bold text-[#30D158] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Precisión: {accuracyScore}%
                  </span>
                )}

                <button
                  onClick={runExerciseSequence}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
                    isPlayingSequence
                      ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                  }`}
                >
                  {isPlayingSequence ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlayingSequence ? "Detener Secuencia" : "Iniciar Secuencia Guiada"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MÓDULO 2: RESPIRACIÓN DIAFRAGMÁTICA (4-4-8) */}
      {activeTab === "breathing" && (
        <div className="apple-glass rounded-3xl p-8 sm:p-12 border border-white/10 text-center flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-[#0A84FF]/20 text-[#0A84FF] mb-3">
            <Wind className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
            Ciclo Costo-Diafragmático (4 - 4 - 8)
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mb-8 leading-relaxed">
            Inhala expandiendo costillas inferiores sin levantar hombros (4s), mantén el soporte diafragmático relajado (4s) y exhala con un siseo constante (&quot;Sssss&quot;) dosificando el flujo de aire (8s).
          </p>

          {/* Orbe pulsante animado con CSS */}
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 flex flex-col items-center justify-center mb-8 transition-all duration-1000 ${
              breathPhase === "Inhala"
                ? "border-[#0A84FF] bg-[#0A84FF]/15 scale-105 shadow-[0_0_40px_rgba(10,132,255,0.4)]"
                : breathPhase === "Retén"
                ? "border-[#BF5AF2] bg-[#BF5AF2]/15 scale-100 shadow-[0_0_30px_rgba(191,90,242,0.35)]"
                : "border-[#30D158] bg-[#30D158]/15 scale-95 shadow-[0_0_35px_rgba(48,209,88,0.35)]"
            }`}
          >
            <span className="text-xs uppercase tracking-widest text-zinc-300 font-bold mb-1">
              {breathPhase}
            </span>
            <span className="text-6xl font-extrabold text-white">{breathSeconds}s</span>
          </div>

          <button
            onClick={() => {
              setBreathingActive(!breathingActive);
              setBreathPhase("Inhala");
              setBreathSeconds(4);
            }}
            className="px-8 py-3.5 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.35)] cursor-pointer"
          >
            {breathingActive ? "Pausar Ejercicio" : "Iniciar Temporizador de Aire"}
          </button>
        </div>
      )}

      {/* MÓDULO 3: DETECTOR DE TESITURA & CUERDA ACAPELLA */}
      {activeTab === "range" && (
        <div className="apple-glass rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
              Descubrimiento de Tesitura y Asignación de Cuerda Acapella
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Con el micrófono encendido, haz una sirena vocal continua desde tu nota más grave cómoda hasta tu nota más aguda sin forzar la garganta.
            </p>
          </div>

          {/* Tarjetas de Medición */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 text-center">
              <span className="text-xs text-zinc-400 block mb-1">Nota Más Grave Detectada</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {lowestMidi ? engineMidiToNoteName(lowestMidi, "both") : "—"}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 text-center">
              <span className="text-xs text-zinc-400 block mb-1">Nota Más Aguda Detectada</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {highestMidi ? engineMidiToNoteName(highestMidi, "both") : "—"}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-black/60 border border-white/10 text-center">
              <span className="text-xs text-zinc-400 block mb-1">Amplitud Total</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#30D158]">
                {lowestMidi && highestMidi ? `${highestMidi - lowestMidi} semitonos` : "0 st"}
              </span>
            </div>
          </div>

          {/* Banner de Sugerencia para Multipistas Acapella */}
          {voiceSuggestion && (
            <div
              className="p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                backgroundColor: voiceSuggestion.badgeBg,
                borderColor: voiceSuggestion.borderColor,
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                    Cuerda Vocal Sugerida para tu Proyecto Acapella:
                  </span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
                    style={{ color: voiceSuggestion.textColor }}
                  >
                    {voiceSuggestion.partName}
                  </span>
                </div>
                <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                  {voiceSuggestion.description}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] text-zinc-400 font-semibold">Pistas recomendadas:</span>
                  {voiceSuggestion.suitableTracks.map((trk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white font-medium"
                    >
                      {trk}
                    </span>
                  ))}
                </div>
              </div>

              {onUpdateProfile && (
                <button
                  onClick={handleApplyToProfile}
                  className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition shrink-0 cursor-pointer shadow-md"
                >
                  Guardar en Mi Perfil
                </button>
              )}
            </div>
          )}

          {/* Acciones de Calibración */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                if (lowestMidi) {
                  setRootMidi(lowestMidi + 5);
                  setActiveTab("exercises");
                }
              }}
              disabled={!lowestMidi}
              className="px-5 py-2.5 rounded-xl bg-[#0A84FF] text-white font-bold text-xs disabled:opacity-40 hover:bg-[#0070E0] transition cursor-pointer"
            >
              Calibrar Ejercicios con mi Tono Más Cómodo
            </button>

            <button
              onClick={() => {
                setLowestMidi(null);
                setHighestMidi(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-zinc-300 hover:bg-white/15 text-xs transition cursor-pointer"
            >
              Reiniciar Medición
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
