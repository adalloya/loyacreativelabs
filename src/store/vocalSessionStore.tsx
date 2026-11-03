"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import {
  detectPitchMcLeod,
  freqToPitchData,
  PitchData,
  SOLFEGE_NAMES,
  NOTE_NAMES,
  midiToNoteName,
} from "@/lib/vocalEngine";
import { UserVocalProfile } from "@/components/VocalProfileModal";
import { grandPiano } from "@/audio/grandPianoEngine";
import { StudioSong, LyricLine, loadStudioLibrary, saveStudioLibrary } from "@/lib/musicUtils";
import { AcapellaTakeRecord, loadSavedTakes, persistTake } from "@/lib/acapella-supabase";
import { VOCAL_EXERCISES, VocalExercise } from "@/components/VocalTrainerSuite";
import {
  PitchSample,
  TargetNoteBlock as CanvasTargetNoteBlock,
  LyricCue,
  VocalProfile as CanvasVocalProfile,
} from "@/components/studio/VocalPitchCanvas";

export type DrawerTab = "vocalize" | "songs" | "academy" | "takes";

export interface PitchHistoryPoint {
  timestamp: number; // performance.now()
  freq: number;
  midiFloat: number;
  midiNote: number;
  centsOff: number;
  clarity: number;
  rmsVolume: number;
  targetMidi?: number | null;
}

export interface TargetNoteBlock {
  id: string;
  midi: number;
  noteName: string;
  startTime: number; // en segundos relativos o timeline
  duration: number; // en segundos
}

const DEFAULT_PROFILE: UserVocalProfile = {
  lowestMidi: 45, // A2 (La2)
  highestMidi: 64, // E4 (Mi4)
  passaggioMidi: 62, // D4 (Re4)
  voiceType: "Barítono / Tenor Ligero",
};

interface VocalSessionContextType {
  // Micrófono DSP
  isListening: boolean;
  currentPitch: PitchData | null;
  inputGain: number;
  setInputGain: (g: number) => void;
  startMic: () => Promise<void>;
  stopMic: () => void;
  toggleMic: () => void;
  mediaStream: MediaStream | null;

  // Buffer de Historial y Scrubber (Time Travel)
  pitchHistoryBuffer: PitchHistoryPoint[];
  clearHistoryBuffer: () => void;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  scrubOffsetSeconds: number;
  setScrubOffsetSeconds: (offset: number) => void;
  zoomSeconds: number;
  setZoomSeconds: (zoom: number) => void;

  // 60 FPS Pitch Canvas props
  samplesBuffer: PitchSample[];
  comparisonSamples: PitchSample[];
  targetBlocks: CanvasTargetNoteBlock[];
  activeLyricCue: LyricCue | null;
  nextLyricCue: LyricCue | null;
  sessionElapsedMs: number;
  activePhoneticTip?: string;

  // Perfil Vocal
  vocalProfile: UserVocalProfile;
  updateVocalProfile: (profile: UserVocalProfile) => void;

  // Drawer Lateral
  activeDrawerTab: DrawerTab;
  setActiveDrawerTab: (tab: DrawerTab) => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  setIsDrawerOpen: (open: boolean) => void;

  // Vocalizaciones y Ejercicios
  activeExercise: VocalExercise | null;
  exerciseRootMidi: number;
  setExerciseRootMidi: (midi: number) => void;
  exerciseBpm: number;
  setExerciseBpm: (bpm: number) => void;
  activeStepMidi: number | null;
  isPlayingExercise: boolean;
  startExercise: (ex: VocalExercise) => void;
  stopExercise: () => void;
  exerciseTargetBlocks: TargetNoteBlock[];

  // Canciones y Karaoke (LRCLIB + MP3)
  songsLibrary: StudioSong[];
  activeSong: StudioSong | null;
  loadSong: (song: StudioSong) => void;
  isPlayingSong: boolean;
  songTime: number;
  songDuration: number;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  seekSong: (time: number) => void;
  togglePlaySong: () => void;
  activeLyricLine: LyricLine | null;
  nextLyricLine: LyricLine | null;
  audioElementRef: React.RefObject<HTMLAudioElement | null>;

  // Bitácora A/B y Curva Fantasma
  takesList: AcapellaTakeRecord[];
  ghostTake: AcapellaTakeRecord | null;
  setGhostTake: (take: AcapellaTakeRecord | null) => void;
  isRecordingTake: boolean;
  recordingTitle: string;
  setRecordingTitle: (title: string) => void;
  recordingSeconds: number;
  startRecordingTake: (title?: string) => void;
  stopRecordingTake: () => Promise<AcapellaTakeRecord | null>;

  // Teclado Interactivo (Iluminación Dual)
  targetPianoNotes: Set<number>; // Iluminación Azul
  sungPianoMidi: number | null; // Iluminación Verde/Ámbar
  sustainPedal: boolean;
  toggleSustainPedal: () => void;

  // Hardware y Consola Superior
  metronomePlaying: boolean;
  metronomeBpm: number;
  setMetronomeBpm: (bpm: number) => void;
  toggleMetronome: () => void;
  reverbActive: boolean;
  toggleReverb: () => void;
  wakeLockActive: boolean;
  toggleWakeLock: () => void;
  guitarTunerOpen: boolean;
  toggleGuitarTuner: () => void;
  isProfilePopoverOpen: boolean;
  setIsProfilePopoverOpen: (open: boolean) => void;
  teleprompterOpen: boolean;
  toggleTeleprompter: () => void;
  setTeleprompterOpen: (open: boolean) => void;
  updateActiveSongLyrics: (lyrics: LyricLine[], title?: string, artist?: string) => void;
}

const VocalSessionContext = createContext<VocalSessionContextType | undefined>(undefined);

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

export function VocalSessionProvider({ children }: { children: React.ReactNode }) {
  // DSP & Mic
  const [isListening, setIsListening] = useState<boolean>(false);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [inputGain, setInputGain] = useState<number>(1.0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Buffer de Historia Continua (Hasta 15 minutos a 30 FPS ~ 27,000 puntos)
  const [pitchHistoryBuffer, setPitchHistoryBuffer] = useState<PitchHistoryPoint[]>([]);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [scrubOffsetSeconds, setScrubOffsetSeconds] = useState<number>(0);
  const [zoomSeconds, setZoomSeconds] = useState<number>(10); // 10 segundos visibles en lienzo

  // 60 FPS Pitch Canvas props & time tracking
  const sessionStartRef = useRef<number>(Date.now());
  const [sessionElapsedMs, setSessionElapsedMs] = useState<number>(0);
  const [samplesBuffer, setSamplesBuffer] = useState<PitchSample[]>([]);
  const [canvasTargetBlocks, setCanvasTargetBlocks] = useState<CanvasTargetNoteBlock[]>([]);

  // Perfil Vocal
  const [vocalProfile, setVocalProfile] = useState<UserVocalProfile>(DEFAULT_PROFILE);
  const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState<boolean>(false);

  // Drawer
  const [activeDrawerTab, setActiveDrawerTab] = useState<DrawerTab>("vocalize");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Vocalizaciones
  const [activeExercise, setActiveExercise] = useState<VocalExercise | null>(null);
  const [exerciseRootMidi, setExerciseRootMidi] = useState<number>(48); // C3
  const [exerciseBpm, setExerciseBpm] = useState<number>(105);
  const [activeStepMidi, setActiveStepMidi] = useState<number | null>(null);
  const [isPlayingExercise, setIsPlayingExercise] = useState<boolean>(false);
  const [exerciseTargetBlocks, setExerciseTargetBlocks] = useState<TargetNoteBlock[]>([]);
  const exerciseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Canciones
  const [songsLibrary, setSongsLibrary] = useState<StudioSong[]>([]);
  const [activeSong, setActiveSong] = useState<StudioSong | null>(null);
  const [isPlayingSong, setIsPlayingSong] = useState<boolean>(false);
  const [songTime, setSongTime] = useState<number>(0);
  const [songDuration, setSongDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let animId: number;
    const tick = () => {
      if (isPlayingSong && audioElementRef.current) {
        const cur = audioElementRef.current.currentTime;
        setSessionElapsedMs(cur * 1000);
        setSongTime(cur);
      } else {
        setSessionElapsedMs(Date.now() - sessionStartRef.current);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlayingSong]);

  // Bitácora A/B
  const [takesList, setTakesList] = useState<AcapellaTakeRecord[]>([]);
  const [ghostTake, setGhostTake] = useState<AcapellaTakeRecord | null>(null);
  const [isRecordingTake, setIsRecordingTake] = useState<boolean>(false);
  const [recordingTitle, setRecordingTitle] = useState<string>("Toma - Práctica");
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const takeAccuracySamplesRef = useRef<number[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Teclado
  const [targetPianoNotes, setTargetPianoNotes] = useState<Set<number>>(new Set());
  const [sustainPedal, setSustainPedal] = useState<boolean>(false);

  // Hardware Console
  const [metronomePlaying, setMetronomePlaying] = useState<boolean>(false);
  const [metronomeBpm, setMetronomeBpm] = useState<number>(120);
  const metronomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [reverbActive, setReverbActive] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<{ release: () => Promise<void> } | null>(null);
  const [guitarTunerOpen, setGuitarTunerOpen] = useState<boolean>(false);
  const [teleprompterOpen, setTeleprompterOpen] = useState<boolean>(false);

  // 1. Cargar datos iniciales de localStorage
  useEffect(() => {
    try {
      const savedProf = localStorage.getItem("voxstudio_vocal_profile");
      if (savedProf) setVocalProfile(JSON.parse(savedProf));

      const loadedSongs = loadStudioLibrary();
      setSongsLibrary(loadedSongs);
      if (loadedSongs.length > 0) setActiveSong(loadedSongs[0]);

      loadSavedTakes().then((takes) => setTakesList(takes));

      // Precargar motor de grand piano
      grandPiano.load().catch(() => {});
    } catch (e) {
      console.warn("Init storage load error:", e);
    }
  }, []);

  const updateVocalProfile = (p: UserVocalProfile) => {
    setVocalProfile(p);
    try {
      localStorage.setItem("voxstudio_vocal_profile", JSON.stringify(p));
    } catch {}
  };

  const clearHistoryBuffer = () => {
    setPitchHistoryBuffer([]);
    setSamplesBuffer([]);
    sessionStartRef.current = Date.now();
    setSessionElapsedMs(0);
  };

  // 2. Control del Micrófono DSP con McLeod Algorithm
  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    setMediaStream(null);
    setIsListening(false);
    setCurrentPitch(null);
  }, [mediaStream]);

  const startMic = async () => {
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
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(inputGain, audioCtx.currentTime);
      micGainRef.current = gainNode;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(gainNode);
      gainNode.connect(analyser);

      // Reverb espacial
      try {
        const convolver = audioCtx.createConvolver();
        convolver.buffer = createConcertHallReverb(audioCtx, 2.2, 2.0);
        const reverbGain = audioCtx.createGain();
        reverbGain.gain.setValueAtTime(reverbActive ? 0.35 : 0, audioCtx.currentTime);
        source.connect(convolver);
        convolver.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        reverbGainRef.current = reverbGain;
      } catch (e) {
        console.warn("Reverb node error:", e);
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

      const updatePitchLoop = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const { freq, clarity, rms } = detectPitchMcLeod(buffer, audioCtx.sampleRate);
        const now = performance.now();

        if (freq > 62 && freq < 1050 && clarity >= 0.62) {
          if (smoothedFreq === 0 || Math.abs(freq - smoothedFreq) > 35) {
            smoothedFreq = freq;
          } else {
            smoothedFreq = smoothedFreq * 0.72 + freq * 0.28;
          }

          const rawData = freqToPitchData(smoothedFreq, clarity, rms);

          // Histeresis de 110ms para evitar vibrato jitter
          if (stableNoteMidi === null) {
            stableNoteMidi = rawData.midi;
            candidateMidi = rawData.midi;
            candidateFirstSeen = now;
          } else if (rawData.midi !== stableNoteMidi) {
            if (candidateMidi !== rawData.midi) {
              candidateMidi = rawData.midi;
              candidateFirstSeen = now;
            } else if (now - candidateFirstSeen >= 110) {
              stableNoteMidi = rawData.midi;
            }
          } else {
            candidateMidi = rawData.midi;
            candidateFirstSeen = now;
          }

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

          // Si estamos grabando toma, recolectar precisión
          if (isRecordingTake) {
            const accuracy = Math.max(0, 100 - Math.abs(finalData.cents) * 1.8);
            takeAccuracySamplesRef.current.push(accuracy);
          }

          // Alimentar buffer continuo del lienzo a ~40 FPS (cada 25ms)
          if (now - lastHistoryPush >= 25) {
            lastHistoryPush = now;
            const nowSession = Date.now() - sessionStartRef.current;
            const currentSample: PitchSample = {
              timestamp: nowSession,
              freq: finalData.frequency,
              midiFloat: finalData.midiFloat,
              centsOff: finalData.cents,
              rms: finalData.rms,
            };

            setSamplesBuffer((prev) => {
              const cutoff = nowSession - 12 * 60 * 1000;
              const startIdx = prev.findIndex((p) => p.timestamp >= cutoff);
              const trimmed = startIdx > 0 ? prev.slice(startIdx) : prev;
              return [...trimmed, currentSample];
            });

            setPitchHistoryBuffer((prev) => {
              // Limitar a los últimos 12 minutos (aprox. 28,000 puntos)
              const cutoff = now - 12 * 60 * 1000;
              const startIdx = prev.findIndex((p) => p.timestamp >= cutoff);
              const trimmed = startIdx > 0 ? prev.slice(startIdx) : prev;
              return [
                ...trimmed,
                {
                  timestamp: now,
                  freq: finalData.frequency,
                  midiFloat: finalData.midiFloat,
                  midiNote: finalData.midi,
                  centsOff: finalData.cents,
                  clarity: finalData.clarity,
                  rmsVolume: finalData.rms,
                  targetMidi: activeStepMidi,
                },
              ];
            });
          }
        } else {
          // Gracia de silencio (~240ms)
          if (lastValidPitch && now - lastValidTime < 240) {
            // Mantener
          } else {
            lastValidPitch = null;
            stableNoteMidi = null;
            candidateMidi = null;
            smoothedFreq = 0;
            setCurrentPitch(null);
          }
        }

        rafRef.current = requestAnimationFrame(updatePitchLoop);
      };

      rafRef.current = requestAnimationFrame(updatePitchLoop);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Por favor permite el acceso al micrófono para activar el lienzo vocal.");
    }
  };

  const toggleMic = () => {
    if (isListening) stopMic();
    else startMic();
  };

  // 3. Control de Ejercicios y Vocalizaciones (Inyectados al Lienzo y Piano)
  const stopExercise = () => {
    if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
    exerciseTimerRef.current = null;
    setIsPlayingExercise(false);
    setActiveStepMidi(null);
    setTargetPianoNotes(new Set());
    setCanvasTargetBlocks([]);
  };

  const startExercise = (exercise: VocalExercise) => {
    stopExercise();
    setActiveExercise(exercise);
    setIsPlayingExercise(true);

    const stepDurationMs = (60 / (exerciseBpm || exercise.tempoBpm)) * 1000;
    const intervals = exercise.intervals;
    let step = 0;
    let currentRoot = exerciseRootMidi;

    // Generar bloques objetivo para el canvas
    const currentSessionTime = Date.now() - sessionStartRef.current;
    const canvasBlocks: CanvasTargetNoteBlock[] = intervals.map((interval, idx) => ({
      id: `${exercise.id}-${idx}`,
      midi: currentRoot + interval,
      startTimeMs: currentSessionTime + idx * stepDurationMs,
      durationMs: stepDurationMs,
      label: exercise.phonetic || exercise.title,
    }));
    setCanvasTargetBlocks(canvasBlocks);

    const blocks: TargetNoteBlock[] = intervals.map((interval, idx) => ({
      id: `${exercise.id}-${idx}`,
      midi: currentRoot + interval,
      noteName: midiToNoteName(currentRoot + interval, "both"),
      startTime: (idx * stepDurationMs) / 1000,
      duration: stepDurationMs / 1000,
    }));
    setExerciseTargetBlocks(blocks);

    const playStep = () => {
      const midiToPlay = currentRoot + intervals[step];
      setActiveStepMidi(midiToPlay);
      setTargetPianoNotes(new Set([midiToPlay]));

      // Tocar en el Grand Piano real
      grandPiano.playNote(midiToPlay, (stepDurationMs / 1000) * 0.9, 0.85);

      step++;
      if (step >= intervals.length) {
        step = 0;
        // Ascenso de semitono opcional si no excede rango agudo
        if (currentRoot + 1 <= vocalProfile.highestMidi - 5) {
          currentRoot += 1;
        } else {
          currentRoot = vocalProfile.lowestMidi + 3;
        }
      }
    };

    playStep();
    exerciseTimerRef.current = setInterval(playStep, stepDurationMs);
  };

  // 4. Canciones y Karaoke (LRCLIB + MP3)
  const loadSong = (song: StudioSong) => {
    setActiveSong(song);
    setIsPlayingSong(false);
    setSongTime(0);
    setSessionElapsedMs(0);
    sessionStartRef.current = Date.now();
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0;
    }
  };

  const togglePlaySong = () => {
    if (!audioElementRef.current || !activeSong?.audioUrl) return;

    if (isPlayingSong) {
      audioElementRef.current.pause();
      setIsPlayingSong(false);
    } else {
      audioElementRef.current.play().then(() => {
        setIsPlayingSong(true);
      }).catch((e) => console.warn("Audio play blocked:", e));
    }
  };

  const seekSong = (time: number) => {
    setSongTime(time);
    setSessionElapsedMs(time * 1000);
    sessionStartRef.current = Date.now() - time * 1000;
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  };

  // Líricas activas en tiempo real
  const activeLyricIndex = activeSong?.lyrics.findIndex((line, i) => {
    const nextLine = activeSong.lyrics[i + 1];
    if (line.time === null) return false;
    if (nextLine && nextLine.time !== null) {
      return songTime >= line.time && songTime < nextLine.time;
    }
    return songTime >= line.time;
  }) ?? -1;

  const activeLyricLine = activeLyricIndex >= 0 && activeSong ? activeSong.lyrics[activeLyricIndex] : null;
  const nextLyricLine =
    activeLyricIndex >= 0 && activeSong && activeLyricIndex + 1 < activeSong.lyrics.length
      ? activeSong.lyrics[activeLyricIndex + 1]
      : null;

  const activeLyricCue: LyricCue | null = activeLyricLine
    ? {
        id: activeLyricLine.id,
        startTimeMs: (activeLyricLine.time || 0) * 1000,
        endTimeMs: (nextLyricLine?.time || (activeLyricLine.time || 0) + 4) * 1000,
        text: activeLyricLine.text,
        chord: activeLyricLine.chord,
        targetNote: activeLyricLine.chord ? `${activeLyricLine.chord}` : undefined,
        vocalTip: activeLyricLine.vocalCue || "Voz de pecho y apoyo diafragmático",
        registerBadge: "Voz de Pecho",
      }
    : null;

  const nextLyricCue: LyricCue | null = nextLyricLine
    ? {
        id: nextLyricLine.id,
        startTimeMs: (nextLyricLine.time || 0) * 1000,
        endTimeMs: ((nextLyricLine.time || 0) + 4) * 1000,
        text: nextLyricLine.text,
        chord: nextLyricLine.chord,
        vocalTip: nextLyricLine.vocalCue,
      }
    : null;

  const activePhoneticTip = activeExercise
    ? `${activeExercise.phonetic} — ${activeExercise.description}`
    : activeLyricCue?.vocalTip || undefined;

  const updateActiveSongLyrics = (newLyrics: LyricLine[], title?: string, artist?: string) => {
    if (activeSong) {
      const updated: StudioSong = {
        ...activeSong,
        title: title || activeSong.title,
        artist: artist || activeSong.artist,
        lyrics: newLyrics,
        isSynced: newLyrics.some((l) => l.time !== null),
      };
      setActiveSong(updated);
      setSongsLibrary((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else {
      const newSong: StudioSong = {
        id: `song-${Date.now()}`,
        title: title || "Canción Seleccionada",
        artist: artist || "Artista",
        audioUrl: "",
        lyrics: newLyrics,
        isSynced: newLyrics.some((l) => l.time !== null),
        createdAt: Date.now(),
      };
      setActiveSong(newSong);
      setSongsLibrary((prev) => [newSong, ...prev]);
    }
  };

  const comparisonSamples: PitchSample[] = [];

  // 5. Grabación de Tomas A/B y Comparador
  const startRecordingTake = (title = "Toma - Práctica") => {
    if (!mediaStream) {
      alert("Enciende el micrófono para grabar la toma.");
      return;
    }

    try {
      const recorder = new MediaRecorder(mediaStream);
      recordedChunksRef.current = [];
      takeAccuracySamplesRef.current = [];
      setRecordingTitle(title);
      setRecordingSeconds(0);
      setIsRecordingTake(true);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Recording error:", e);
    }
  };

  const stopRecordingTake = async (): Promise<AcapellaTakeRecord | null> => {
    if (!mediaRecorderRef.current || !isRecordingTake) return null;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingTake(false);

    return new Promise((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        const samples = takeAccuracySamplesRef.current;
        const avgAcc =
          samples.length > 0
            ? Math.round(samples.reduce((acc, v) => acc + v, 0) / samples.length)
            : 85;

        const newTake: AcapellaTakeRecord = {
          id: `take-${Date.now()}`,
          title: recordingTitle || `Toma #${takesList.length + 1}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          durationSec: recordingSeconds || 5,
          avgAccuracy: avgAcc,
          dominantNote: currentPitch?.noteName || "Mi3",
          audioUrl,
        };

        const updated = [newTake, ...takesList];
        setTakesList(updated);
        persistTake(newTake).catch(() => {});
        resolve(newTake);
      };

      mediaRecorderRef.current!.stop();
    });
  };

  // 6. Metrónomo
  const toggleMetronome = () => {
    if (metronomePlaying) {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      setMetronomePlaying(false);
    } else {
      setMetronomePlaying(true);
      const intervalMs = (60 / metronomeBpm) * 1000;
      let tick = 0;
      const playTick = () => {
        grandPiano.playNote(tick % 4 === 0 ? 76 : 72, 0.08, 0.6);
        tick++;
      };
      playTick();
      metronomeTimerRef.current = setInterval(playTick, intervalMs);
    }
  };

  // 7. Reverb
  const toggleReverb = () => {
    const next = !reverbActive;
    setReverbActive(next);
    if (reverbGainRef.current && audioCtxRef.current) {
      reverbGainRef.current.gain.setValueAtTime(next ? 0.35 : 0, audioCtxRef.current.currentTime);
    }
  };

  // 8. Wake Lock (Modo Atril)
  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      if (wakeLockSentinelRef.current) {
        await wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
      setWakeLockActive(false);
    } else {
      try {
        if ("wakeLock" in navigator) {
          const navWithWake = navigator as unknown as {
            wakeLock: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> };
          };
          wakeLockSentinelRef.current = await navWithWake.wakeLock.request("screen");
          setWakeLockActive(true);
        } else {
          setWakeLockActive(true);
        }
      } catch {
        setWakeLockActive(true);
      }
    }
  };

  // 9. Sustain Pedal
  const toggleSustainPedal = () => {
    const next = !sustainPedal;
    setSustainPedal(next);
    grandPiano.setSustain(next);
  };

  const sungPianoMidi = currentPitch && currentPitch.clarity >= 0.65 ? currentPitch.midi : null;

  return (
    <VocalSessionContext.Provider
      value={{
        isListening,
        currentPitch,
        inputGain,
        setInputGain,
        startMic,
        stopMic,
        toggleMic,
        mediaStream,

        pitchHistoryBuffer,
        clearHistoryBuffer,
        isLive,
        setIsLive,
        scrubOffsetSeconds,
        setScrubOffsetSeconds,
        zoomSeconds,
        setZoomSeconds,

        samplesBuffer,
        comparisonSamples,
        targetBlocks: canvasTargetBlocks,
        activeLyricCue,
        nextLyricCue,
        sessionElapsedMs,
        activePhoneticTip,

        vocalProfile,
        updateVocalProfile,

        activeDrawerTab,
        setActiveDrawerTab,
        isDrawerOpen,
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
        setIsDrawerOpen,

        activeExercise,
        exerciseRootMidi,
        setExerciseRootMidi,
        exerciseBpm,
        setExerciseBpm,
        activeStepMidi,
        isPlayingExercise,
        startExercise,
        stopExercise,
        exerciseTargetBlocks,

        songsLibrary,
        activeSong,
        loadSong,
        isPlayingSong,
        songTime,
        songDuration,
        playbackRate,
        setPlaybackRate,
        seekSong,
        togglePlaySong,
        activeLyricLine,
        nextLyricLine,
        audioElementRef,

        takesList,
        ghostTake,
        setGhostTake,
        isRecordingTake,
        recordingTitle,
        setRecordingTitle,
        recordingSeconds,
        startRecordingTake,
        stopRecordingTake,

        targetPianoNotes,
        sungPianoMidi,
        sustainPedal,
        toggleSustainPedal,

        metronomePlaying,
        metronomeBpm,
        setMetronomeBpm,
        toggleMetronome,
        reverbActive,
        toggleReverb,
        wakeLockActive,
        toggleWakeLock,
        guitarTunerOpen,
        toggleGuitarTuner: () => setGuitarTunerOpen((prev) => !prev),
        isProfilePopoverOpen,
        setIsProfilePopoverOpen,
        teleprompterOpen,
        toggleTeleprompter: () => setTeleprompterOpen((prev) => !prev),
        setTeleprompterOpen,
        updateActiveSongLyrics,
      }}
    >
      {/* Audio Element Oculto para sincronizar MP3 / Canciones */}
      <audio
        ref={audioElementRef}
        src={activeSong?.audioUrl || undefined}
        onTimeUpdate={(e) => setSongTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setSongDuration(e.currentTarget.duration);
          if (audioElementRef.current) audioElementRef.current.playbackRate = playbackRate;
        }}
        onEnded={() => setIsPlayingSong(false)}
        className="hidden"
      />
      {children}
    </VocalSessionContext.Provider>
  );
}

export function useVocalSession() {
  const context = useContext(VocalSessionContext);
  if (!context) {
    throw new Error("useVocalSession must be used within a VocalSessionProvider");
  }
  return context;
}
