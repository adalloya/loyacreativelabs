"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { grandPiano } from "@/audio/grandPianoEngine";
import {
  fetchOnlineRepertoireFromSupabase,
  saveCustomXmlToSupabase,
  DEFAULT_ONLINE_REPERTOIRE,
  OnlineRepertoireSong,
} from "@/services/alesisRepertoireSupabase";
import {
  Usb,
  Upload,
  Mic,
  RotateCcw,
  Piano,
  BookOpen,
  Terminal,
  X,
  Volume2,
  Sparkles,
  Cloud,
  RefreshCw,
  Smartphone,
  Lightbulb,
  Sliders,
} from "lucide-react";

export interface LessonStep {
  note: number;
  name: string;
  lyric: string;
  finger: number;
  hand?: string;
}

export interface BeginnerLesson {
  title: string;
  level: string;
  sequence: LessonStep[];
  musicXml: string;
}

type LedColor = "orange" | "green" | "red" | null;

// Protocolo Oficial extraído directamente de AlesisMidiLEDController.kt (Skoove Android App):
// Manufacturer ID: [0x00, 0x00, 0x0E] (Alesis)
// Product Model ID: [0x00, 0x4D] (77 = Teacher's Choice 61)
// MessageTypeIdentifier: SET_LED = 0x00, RESET_ALL = 0x04
// LedColors: OFF = 0x00 (0), RED = 0x01 (1), GREEN = 0x09 (9), AMBER = 0x17 (23)
const ALESIS_TC61_SYSEX_HEADER = [0xf0, 0x00, 0x00, 0x0e, 0x00, 0x4d] as const;
const ALESIS_TC61_MSG_SET_LED = 0x00;
const ALESIS_TC61_MSG_RESET_ALL = 0x04;
const ALESIS_TC61_COLOR_OFF = 0x00;   // 0
const ALESIS_TC61_COLOR_RED = 0x01;   // 1
const ALESIS_TC61_COLOR_GREEN = 0x09; // 9
const ALESIS_TC61_COLOR_AMBER = 0x17; // 23

export function buildAlesisTc61SetLedSysEx(noteNumber: number, colorByte: number): number[] {
  return [
    ...ALESIS_TC61_SYSEX_HEADER,
    ALESIS_TC61_MSG_SET_LED,
    noteNumber & 0x7f,
    colorByte & 0x7f,
    0xf7,
  ];
}

export function buildAlesisTc61ResetAllSysEx(): number[] {
  return [...ALESIS_TC61_SYSEX_HEADER, ALESIS_TC61_MSG_RESET_ALL, 0xf7];
}

declare global {
  interface Window {
    opensheetmusicdisplay?: {
      OpenSheetMusicDisplay: new (
        container: HTMLElement,
        options?: {
          autoResize?: boolean;
          backend?: string;
          drawFingerings?: boolean;
          drawingParameters?: string;
        }
      ) => {
        load: (xml: string) => Promise<void>;
        render: () => void;
        cursor?: {
          show: () => void;
          next: () => void;
          reset: () => void;
        };
      };
    };
  }
}

function buildLessonMusicXML(title: string, steps: LessonStep[]): string {
  const stepMap: Record<number, { step: string; octave: number; alter?: number }> = {
    48: { step: "C", octave: 3 },
    49: { step: "C", octave: 3, alter: 1 },
    50: { step: "D", octave: 3 },
    51: { step: "D", octave: 3, alter: 1 },
    52: { step: "E", octave: 3 },
    53: { step: "F", octave: 3 },
    54: { step: "F", octave: 3, alter: 1 },
    55: { step: "G", octave: 3 },
    56: { step: "G", octave: 3, alter: 1 },
    57: { step: "A", octave: 3 },
    58: { step: "A", octave: 3, alter: 1 },
    59: { step: "B", octave: 3 },
    60: { step: "C", octave: 4 },
    61: { step: "C", octave: 4, alter: 1 },
    62: { step: "D", octave: 4 },
    63: { step: "D", octave: 4, alter: 1 },
    64: { step: "E", octave: 4 },
    65: { step: "F", octave: 4 },
    66: { step: "F", octave: 4, alter: 1 },
    67: { step: "G", octave: 4 },
    68: { step: "G", octave: 4, alter: 1 },
    69: { step: "A", octave: 4 },
    70: { step: "A", octave: 4, alter: 1 },
    71: { step: "B", octave: 4 },
    72: { step: "C", octave: 5 },
    73: { step: "C", octave: 5, alter: 1 },
    74: { step: "D", octave: 5 },
    75: { step: "D", octave: 5, alter: 1 },
    76: { step: "E", octave: 5 },
  };

  const notesXml = steps
    .map((s) => {
      const info = stepMap[s.note] || { step: "C", octave: 4 };
      return `
      <note>
        <pitch>
          <step>${info.step}</step>
          ${info.alter ? `<alter>${info.alter}</alter>` : ""}
          <octave>${info.octave}</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations>
          <technical>
            <fingering>${s.finger}</fingering>
          </technical>
        </notations>
      </note>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <part-list>
    <score-part id="P1"><part-name>Piano</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>${steps.length}</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      ${notesXml}
    </measure>
  </part>
</score-partwise>`;
}

export const BEGINNER_LESSONS: BeginnerLesson[] = [
  {
    title: "Lección 1: Pentacorde de Do Mayor (Dedos 1-5)",
    level: "Principiante",
    sequence: [
      { note: 60, name: "C4 (Do)", lyric: "Do - Dedo 1 (Pulgar)", finger: 1, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2 (Índice)", finger: 2, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 65, name: "F4 (Fa)", lyric: "Fa - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 67, name: "G4 (Sol)", lyric: "Sol - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
    ],
    musicXml: "",
  },
  {
    title: "Lección 2: Independencia de Dedos (Hanon)",
    level: "Principiante",
    sequence: [
      { note: 60, name: "C4 (Do)", lyric: "Do - Dedo 1", finger: 1, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3", finger: 3, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2", finger: 2, hand: "Mano Der." },
      { note: 65, name: "F4 (Fa)", lyric: "Fa - Dedo 4", finger: 4, hand: "Mano Der." },
    ],
    musicXml: "",
  },
  {
    title: "Lección 3: Escala Básica de Do Mayor",
    level: "Principiante",
    sequence: [
      { note: 60, name: "C4 (Do)", lyric: "Do - Dedo 1", finger: 1, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2", finger: 2, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3", finger: 3, hand: "Mano Der." },
      { note: 65, name: "F4 (Fa)", lyric: "Fa - Dedo 1 (Cruce)", finger: 1, hand: "Mano Der." },
      { note: 67, name: "G4 (Sol)", lyric: "Sol - Dedo 2", finger: 2, hand: "Mano Der." },
      { note: 69, name: "A4 (La)", lyric: "La - Dedo 3", finger: 3, hand: "Mano Der." },
      { note: 71, name: "B4 (Si)", lyric: "Si - Dedo 4", finger: 4, hand: "Mano Der." },
      { note: 72, name: "C5 (Do)", lyric: "Do - Dedo 5", finger: 5, hand: "Mano Der." },
    ],
    musicXml: "",
  },
];

BEGINNER_LESSONS.forEach((lesson) => {
  lesson.musicXml = buildLessonMusicXML(lesson.title, lesson.sequence);
});

const BLACK_KEY_NUMBERS = [49, 51, 54, 56, 58, 61, 63, 66, 68, 70, 73, 75];
const KEY_RANGE = Array.from({ length: 76 - 48 + 1 }, (_, idx) => 48 + idx);

const NOTE_LABELS: Record<number, string> = {
  48: "C3",
  49: "C#3",
  50: "D3",
  51: "D#3",
  52: "E3",
  53: "F3",
  54: "F#3",
  55: "G3",
  56: "G#3",
  57: "A3",
  58: "A#3",
  59: "B3",
  60: "C4",
  61: "C#4",
  62: "D4",
  63: "D#4",
  64: "E4",
  65: "F4",
  66: "F#4",
  67: "G4",
  68: "G#4",
  69: "A4",
  70: "A#4",
  71: "B4",
  72: "C5",
  73: "C#5",
  74: "D5",
  75: "D#5",
  76: "E5",
};

const SOLFEGE_LABELS: Record<number, string> = {
  48: "Do3",
  49: "Do#3",
  50: "Re3",
  51: "Re#3",
  52: "Mi3",
  53: "Fa3",
  54: "Fa#3",
  55: "Sol3",
  56: "Sol#3",
  57: "La3",
  58: "La#3",
  59: "Si3",
  60: "Do4",
  61: "Do#4",
  62: "Re4",
  63: "Re#4",
  64: "Mi4",
  65: "Fa4",
  66: "Fa#4",
  67: "Sol4",
  68: "Sol#4",
  69: "La4",
  70: "La#4",
  71: "Si4",
  72: "Do5",
  73: "Do#5",
  74: "Re5",
  75: "Re#5",
  76: "Mi5",
};

interface AlesisPianoStudioSectionProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function AlesisPianoStudioSection({
  onClose,
  isEmbedded = false,
}: AlesisPianoStudioSectionProps) {
  const [practiceMode, setPracticeMode] = useState<"lesson" | "repertoire">("lesson");
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [onlineRepertoire, setOnlineRepertoire] = useState<OnlineRepertoireSong[]>(
    DEFAULT_ONLINE_REPERTOIRE
  );
  const [selectedRepertoireId, setSelectedRepertoireId] = useState<string>("");
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [keyColors, setKeyColors] = useState<Record<number, LedColor>>({
    60: "orange",
  });

  const [showCalibrator, setShowCalibrator] = useState<boolean>(false);
  const [sysexEnabled, setSysexEnabled] = useState<boolean>(false);

  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string>("");
  const [midiPermissionDenied, setMidiPermissionDenied] = useState<boolean>(false);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [osmdReady, setOsmdReady] = useState<boolean>(false);

  const [isNaturalLandscape, setIsNaturalLandscape] = useState<boolean>(false);
  const [forcedLandscape, setForcedLandscape] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [Sistema] Protocolo Oficial Skoove AlesisMidiLED listo ([F0 00 00 0E 00 4D]: Ámbar=0x17, Verde=0x09, Rojo=0x01, Off=0x00).`,
  ]);

  const midiOutputsRef = useRef<MIDIOutput[]>([]);
  const midiInputsRef = useRef<MIDIInput[]>([]);
  const litHardwareNotesRef = useRef<Set<number>>(new Set());
  const activeFeedbackRef = useRef<{ note: number; color: "green" | "red" } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sysexEnabledRef = useRef<boolean>(false);

  const osmdContainerRef = useRef<HTMLDivElement | null>(null);
  const osmdInstanceRef = useRef<{
    load: (xml: string) => Promise<void>;
    render: () => void;
    cursor?: { show: () => void; next: () => void; reset: () => void };
  } | null>(null);
  const logConsoleRef = useRef<HTMLDivElement | null>(null);
  const virtualKeyboardRef = useRef<HTMLDivElement | null>(null);
  const keyElementRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  }, []);

  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h && h < 600;
      setIsNaturalLandscape(landscape);
      if (landscape) {
        setForcedLandscape(false);
      }
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const toggleHorizontalOrientation = async () => {
    try {
      const screenOrientation = (
        window.screen as unknown as {
          orientation?: {
            type?: string;
            lock?: (mode: string) => Promise<void>;
            unlock?: () => void;
          };
        }
      )?.orientation;

      if (isNaturalLandscape || forcedLandscape) {
        if (screenOrientation?.unlock) {
          try {
            screenOrientation.unlock();
          } catch {}
        }
        if (document.fullscreenElement && document.exitFullscreen) {
          try {
            await document.exitFullscreen();
          } catch {}
        }
        setForcedLandscape(false);
        addLog("Vista cambiada a modo Vertical.");
        return;
      }

      if (screenOrientation?.lock) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
          await screenOrientation.lock("landscape");
          addLog("Pantalla rotada a modo Horizontal nativo.");
          return;
        } catch {}
      }

      setForcedLandscape((prev) => !prev);
      addLog("Modo Horizontal activado en pantalla.");
    } catch {
      setForcedLandscape((prev) => !prev);
    }
  };

  const activeRepertoireSong =
    onlineRepertoire.find((item) => item.id === selectedRepertoireId) || onlineRepertoire[0];

  const activeTitle =
    practiceMode === "repertoire" && activeRepertoireSong
      ? `${activeRepertoireSong.title}`
      : BEGINNER_LESSONS[currentLessonIndex].title;

  const activeSequence: LessonStep[] =
    practiceMode === "repertoire" && activeRepertoireSong
      ? activeRepertoireSong.sequence
      : BEGINNER_LESSONS[currentLessonIndex].sequence;

  const activeMusicXml: string =
    practiceMode === "repertoire" && activeRepertoireSong
      ? activeRepertoireSong.musicXml
      : BEGINNER_LESSONS[currentLessonIndex].musicXml;

  const activeSequenceRef = useRef<LessonStep[]>(activeSequence);
  const stepIndexRef = useRef<number>(currentIndex);

  useEffect(() => {
    activeSequenceRef.current = activeSequence;
  }, [activeSequence]);

  useEffect(() => {
    stepIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [logs]);

  const syncSupabaseRepertoire = useCallback(async () => {
    setIsSyncingSupabase(true);
    try {
      const items = await fetchOnlineRepertoireFromSupabase();
      setOnlineRepertoire(items);
      addLog(
        `[Supabase DB] Repertorio online sincronizado (${items.length} partituras MusicXML disponibles).`
      );
    } catch {
      addLog("[Supabase DB] Usando repertorio local de respaldo.");
    } finally {
      setIsSyncingSupabase(false);
    }
  }, [addLog]);

  useEffect(() => {
    syncSupabaseRepertoire();
  }, [syncSupabaseRepertoire]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.opensheetmusicdisplay) {
      setOsmdReady(true);
      return;
    }
    const existingScript = document.getElementById("osmd-cdn-script") as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => setOsmdReady(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "osmd-cdn-script";
    script.src =
      "https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js";
    script.async = true;
    script.onload = () => {
      setOsmdReady(true);
      addLog("Motor de partituras OSMD 1.8.6 listo.");
    };
    script.onerror = () => {
      addLog("Aviso: No se pudo cargar OSMD desde CDN.");
    };
    document.head.appendChild(script);
  }, [addLog]);

  const centerKeyInVirtualKeyboard = useCallback((noteNumber: number) => {
    const container = virtualKeyboardRef.current;
    const keyEl = keyElementRefs.current[noteNumber];
    if (!container || !keyEl) return;

    try {
      const targetScrollLeft =
        keyEl.offsetLeft - container.clientWidth / 2 + keyEl.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    } catch {
      try {
        keyEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch {}
    }
  }, []);

  // Apagar todos los LEDs del Alesis Teacher's Choice 61 usando el comando oficial RESET_ALL de Skoove:
  // [0xF0, 0x00, 0x00, 0x0E, 0x00, 0x4D, 0x04, 0xF7]
  const sendHardwareResetAllLeds = useCallback(() => {
    const outputs = midiOutputsRef.current;
    if (!outputs || outputs.length === 0) return;

    if (sysexEnabledRef.current) {
      const resetPacket = buildAlesisTc61ResetAllSysEx();
      for (const out of outputs) {
        try {
          out.send(resetPacket);
        } catch {}
      }
      litHardwareNotesRef.current.clear();
      return;
    }

    const previouslyLit = Array.from(litHardwareNotesRef.current);
    for (const prevNote of previouslyLit) {
      for (const out of outputs) {
        try {
          out.send([0x80, prevNote, 0]);
          out.send([0x90, prevNote, 0]);
        } catch {}
      }
    }
    litHardwareNotesRef.current.clear();
  }, []);

  // Control directo del LED físico del Alesis Teacher's Choice 61 usando el protocolo oficial de Skoove (AlesisMidiLEDController.kt):
  // SysEx: [0xF0, 0x00, 0x00, 0x0E, 0x00, 0x4D, 0x00, noteNumber, colorByte, 0xF7]
  // Donde colorByte es: AMBER=0x17 (23), GREEN=0x09 (9), RED=0x01 (1), OFF=0x00 (0).
  const sendHardwareLedMidi = useCallback((noteNumber: number, color: LedColor) => {
    const outputs = midiOutputsRef.current;
    if (!outputs || outputs.length === 0) return;

    if (sysexEnabledRef.current) {
      const colorByte =
        color === "orange"
          ? ALESIS_TC61_COLOR_AMBER
          : color === "green"
          ? ALESIS_TC61_COLOR_GREEN
          : color === "red"
          ? ALESIS_TC61_COLOR_RED
          : ALESIS_TC61_COLOR_OFF;

      const sysexPacket = buildAlesisTc61SetLedSysEx(noteNumber, colorByte);
      for (const out of outputs) {
        try {
          out.send(sysexPacket);
        } catch {}
      }

      if (color === null) {
        litHardwareNotesRef.current.delete(noteNumber);
      } else {
        litHardwareNotesRef.current.add(noteNumber);
      }
      return;
    }

    // Respaldo si el navegador aún no tiene concedido el permiso SysEx
    if (color === null || color === "green") {
      litHardwareNotesRef.current.delete(noteNumber);
      for (const out of outputs) {
        try {
          out.send([0x80, noteNumber, 0]);
          out.send([0x90, noteNumber, 0]);
        } catch {}
      }
      return;
    }

    litHardwareNotesRef.current.add(noteNumber);
    for (const out of outputs) {
      try {
        out.send([0x90, noteNumber, 1]);
      } catch {}
    }
  }, []);

  // Encender en el piano físico y en pantalla la nota objetivo actual
  const syncSequenceLeds = useCallback(
    (sequence: LessonStep[], stepIdx: number) => {
      activeFeedbackRef.current = null;
      sendHardwareResetAllLeds();

      if (stepIdx < sequence.length) {
        const targetNote = sequence[stepIdx].note;
        setKeyColors({ [targetNote]: "orange" });
        centerKeyInVirtualKeyboard(targetNote);
        sendHardwareLedMidi(targetNote, "orange");
      } else {
        setKeyColors({});
      }
    },
    [centerKeyInVirtualKeyboard, sendHardwareLedMidi, sendHardwareResetAllLeds]
  );

  useEffect(() => {
    syncSequenceLeds(activeSequence, currentIndex);
  }, [
    activeSequence,
    currentIndex,
    isNaturalLandscape,
    forcedLandscape,
    syncSequenceLeds,
  ]);

  // Renderizar partitura activa en OSMD
  useEffect(() => {
    if (!osmdReady || !osmdContainerRef.current || !activeMusicXml) return;
    if (!window.opensheetmusicdisplay) return;

    const renderScore = async () => {
      try {
        if (!osmdContainerRef.current || !window.opensheetmusicdisplay) return;
        osmdContainerRef.current.innerHTML = "";
        const instance = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(
          osmdContainerRef.current,
          {
            autoResize: true,
            backend: "svg",
            drawFingerings: true,
            drawingParameters: "compacttight",
          }
        );
        osmdInstanceRef.current = instance;
        await instance.load(activeMusicXml);
        instance.render();
        if (instance.cursor) {
          instance.cursor.show();
          instance.cursor.reset();
        }
        const currentTarget = activeSequenceRef.current[stepIndexRef.current]?.note;
        if (typeof currentTarget === "number") {
          setTimeout(() => centerKeyInVirtualKeyboard(currentTarget), 100);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al renderizar partitura";
        addLog(`Aviso OSMD: ${message}`);
      }
    };

    renderScore();
  }, [osmdReady, activeMusicXml, addLog, centerKeyInVirtualKeyboard]);

  // Evaluar nota tocada por el usuario (vía MIDI USB-C o toque en pantalla)
  const evaluateUserNote = useCallback(
    (playedNote: number) => {
      grandPiano.playNote(playedNote, 0.85);

      const sequence = activeSequenceRef.current;
      const idx = stepIndexRef.current;

      if (idx >= sequence.length) {
        setKeyColors({ [playedNote]: "green" });
        sendHardwareLedMidi(playedNote, "green");
        setTimeout(() => {
          stepIndexRef.current = 0;
          setCurrentIndex(0);
        }, 350);
        return;
      }

      const expectedNote = sequence[idx].note;

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }

      if (playedNote === expectedNote) {
        const nextIdx = idx + 1;
        stepIndexRef.current = nextIdx;

        // 1. En pantalla y en el piano físico encendemos en VERDE (0x09)
        activeFeedbackRef.current = { note: expectedNote, color: "green" };
        setKeyColors({ [expectedNote]: "green" });
        sendHardwareLedMidi(expectedNote, "green");

        addLog(`✓ Correcto: ${sequence[idx].name} con Dedo ${sequence[idx].finger} (Luz Verde 0x09)`);
        if (osmdInstanceRef.current?.cursor) {
          try {
            osmdInstanceRef.current.cursor.next();
          } catch {}
        }

        // 2. Mantener la luz VERDE (0x09) visible durante 420ms y luego encender la siguiente nota en ÁMBAR (0x17)
        feedbackTimerRef.current = setTimeout(() => {
          activeFeedbackRef.current = null;
          feedbackTimerRef.current = null;
          sendHardwareLedMidi(expectedNote, null);
          setCurrentIndex(nextIdx);
          if (nextIdx < sequence.length) {
            const nextNote = sequence[nextIdx].note;
            setKeyColors({ [nextNote]: "orange" });
            centerKeyInVirtualKeyboard(nextNote);
            sendHardwareLedMidi(nextNote, "orange");
          }
        }, 420);
      } else {
        // Si tocó una tecla equivocada:
        // En el piano físico encendemos la tecla equivocada en ROJO (0x01) y mantenemos la correcta en ÁMBAR (0x17)
        activeFeedbackRef.current = { note: playedNote, color: "red" };
        setKeyColors({
          [expectedNote]: "orange",
          [playedNote]: "red",
        });
        centerKeyInVirtualKeyboard(expectedNote);

        sendHardwareLedMidi(playedNote, "red");
        sendHardwareLedMidi(expectedNote, "orange");

        addLog(
          `✕ Tocaste ${NOTE_LABELS[playedNote] || playedNote} (Rojo 0x01). Toca ${sequence[idx].name} (Ámbar 0x17).`
        );

        feedbackTimerRef.current = setTimeout(() => {
          activeFeedbackRef.current = null;
          feedbackTimerRef.current = null;
          setKeyColors((prev) => {
            const copy = { ...prev };
            if (playedNote !== expectedNote) {
              delete copy[playedNote];
            }
            copy[expectedNote] = "orange";
            return copy;
          });
          if (playedNote !== expectedNote) {
            sendHardwareLedMidi(playedNote, null);
          }
          sendHardwareLedMidi(expectedNote, "orange");
        }, 480);
      }
    },
    [addLog, centerKeyInVirtualKeyboard, sendHardwareLedMidi]
  );

  const evaluateUserNoteRef = useRef(evaluateUserNote);
  useEffect(() => {
    evaluateUserNoteRef.current = evaluateUserNote;
  }, [evaluateUserNote]);

  // Inicializar Web MIDI API con SysEx (necesario para enviar [0xF0, 0x00, 0x00, 0x0E, 0x00, 0x4D, ...] al Alesis Teacher's Choice 61)
  const initMIDI = useCallback(
    async (silent = false) => {
      if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
        if (!silent) {
          alert("Web MIDI no soportado en este navegador. Usa Chrome en Android o Desktop.");
          addLog("Error: Web MIDI API no soportada en este navegador.");
        }
        return;
      }

      let midiAccess: MIDIAccess | null = null;

      try {
        setMidiPermissionDenied(false);
        midiAccess = await navigator.requestMIDIAccess({ sysex: true });
        sysexEnabledRef.current = Boolean(midiAccess.sysexEnabled);
        setSysexEnabled(Boolean(midiAccess.sysexEnabled));
      } catch (err) {
        sysexEnabledRef.current = false;
        setSysexEnabled(false);
        setMidiPermissionDenied(true);
        if (!silent) {
          const message = err instanceof Error ? err.message : "Permiso SysEx bloqueado";
          addLog(
            `⚠️ Chrome bloqueó SysEx (${message}). Para ver los 3 colores (Ámbar, Verde y Rojo), toca el icono a la izquierda de la URL en Chrome → Permisos → Dispositivos MIDI → Permitir / Restablecer.`
          );
        }
        try {
          midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        } catch {
          return;
        }
      }

      if (!midiAccess) return;

      const bindPorts = () => {
        if (!midiAccess) return;
        const allOutputs = Array.from(midiAccess.outputs.values());
        const allInputs = Array.from(midiAccess.inputs.values());

        const preferredOutputs = allOutputs.filter((out) => {
          const n = (out.name || "").toLowerCase();
          return (
            !n.includes("through") &&
            (n.includes("alesis") ||
              n.includes("teacher") ||
              n.includes("choice") ||
              n.includes("usb") ||
              n.includes("piano") ||
              n.includes("keyboard"))
          );
        });
        const activeOutputs =
          preferredOutputs.length > 0
            ? preferredOutputs
            : allOutputs.filter((o) => !(o.name || "").toLowerCase().includes("through")).length > 0
            ? allOutputs.filter((o) => !(o.name || "").toLowerCase().includes("through"))
            : allOutputs;

        for (const out of activeOutputs) {
          try {
            if (typeof out.open === "function") {
              out.open();
            }
          } catch {}
        }

        const preferredInputs = allInputs.filter((inp) => {
          const n = (inp.name || "").toLowerCase();
          return (
            !n.includes("through") &&
            (n.includes("alesis") ||
              n.includes("teacher") ||
              n.includes("choice") ||
              n.includes("usb") ||
              n.includes("piano") ||
              n.includes("keyboard"))
          );
        });
        const activeInputs = preferredInputs.length > 0 ? preferredInputs : allInputs;

        for (const inp of activeInputs) {
          try {
            if (typeof inp.open === "function") {
              inp.open();
            }
          } catch {}
          inp.onmidimessage = (event: MIDIMessageEvent) => {
            if (!event.data || event.data.length < 3) return;
            const [status, note, velocity] = event.data;
            const command = status >> 4;
            if (command === 9 && velocity > 0) {
              evaluateUserNoteRef.current(note);
            } else if (command === 8 || (command === 9 && velocity === 0)) {
              const fb = activeFeedbackRef.current;
              if (fb) {
                setTimeout(() => {
                  sendHardwareLedMidi(fb.note, fb.color);
                }, 30);
                return;
              }
              const seq = activeSequenceRef.current;
              const idx = stepIndexRef.current;
              if (idx < seq.length) {
                const targetNote = seq[idx].note;
                setTimeout(() => {
                  sendHardwareLedMidi(targetNote, "orange");
                }, 30);
              }
            }
          };
        }

        midiOutputsRef.current = activeOutputs;
        midiInputsRef.current = activeInputs;

        const deviceLabel =
          activeOutputs[0]?.name || activeInputs[0]?.name || "Alesis Teacher's Choice 61";
        const isConnected = activeOutputs.length > 0 || activeInputs.length > 0;
        setMidiConnected(isConnected);
        setMidiDeviceName(deviceLabel);

        if (isConnected) {
          addLog(
            sysexEnabledRef.current
              ? `✅ ${deviceLabel} conectado con 3 Colores Oficiales Skoove SysEx [F0 00 00 0E 00 4D] (Ámbar=23, Verde=9, Rojo=1).`
              : `⚠️ ${deviceLabel} conectado sin permiso SysEx (solo luz Roja). Habilita permiso MIDI en Chrome para ver Ámbar y Verde.`
          );
          syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current);
        } else if (!silent) {
          addLog("Acceso MIDI activo, esperando conexión USB-C del teclado.");
        }
      };

      bindPorts();
      midiAccess.onstatechange = () => {
        bindPorts();
      };
    },
    [addLog, sendHardwareLedMidi, syncSequenceLeds]
  );

  // Auto-conectar al abrir la página únicamente si el permiso MIDI + SysEx ya fue concedido previamente
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "midi" as PermissionName, sysex: true } as PermissionDescriptor)
        .then((status) => {
          if (status.state === "granted") {
            initMIDI(true);
          }
        })
        .catch(() => {});
    }
  }, [initMIDI]);

  // Probar directamente cualquiera de los 3 colores oficiales de Skoove en la tecla actual
  const testOfficialSkooveColor = useCallback(
    (color: LedColor, label: string) => {
      const seq = activeSequenceRef.current;
      const idx = stepIndexRef.current < seq.length ? stepIndexRef.current : 0;
      const target = seq[idx]?.note || 60;
      centerKeyInVirtualKeyboard(target);

      if (color === null) {
        sendHardwareResetAllLeds();
        setKeyColors({});
        addLog(`⚫ Enviado RESET_ALL oficial Skoove: [F0 00 00 0E 00 4D 04 F7]`);
        return;
      }

      setKeyColors({ [target]: color });
      sendHardwareLedMidi(target, color);
      const byteVal =
        color === "orange" ? "0x17 (23)" : color === "green" ? "0x09 (9)" : "0x01 (1)";
      addLog(
        `🎨 Enviado ${label} a ${NOTE_LABELS[target] || target} (${target}): [F0 00 00 0E 00 4D 00 ${target
          .toString(16)
          .toUpperCase()} ${byteVal} F7]`
      );
    },
    [addLog, centerKeyInVirtualKeyboard, sendHardwareLedMidi, sendHardwareResetAllLeds]
  );

  const uploadAndLoadXML = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addLog(`Procesando archivo: ${file.name}`);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlContent = e.target?.result;
      if (typeof xmlContent !== "string") return;

      try {
        const { song: savedSong, storageUploaded } = await saveCustomXmlToSupabase(
          file.name,
          xmlContent,
          file
        );
        setOnlineRepertoire((prev) => [
          savedSong,
          ...prev.filter((item) => item.id !== savedSong.id),
        ]);
        setSelectedRepertoireId(savedSong.id);
        setPracticeMode("repertoire");
        stepIndexRef.current = 0;
        setCurrentIndex(0);
        addLog(
          storageUploaded
            ? `¡Partitura subida a Storage (sheet-music) y guardada en Supabase con éxito!`
            : `¡Partitura guardada en la tabla 'songs' de Supabase con éxito!`
        );
        syncSupabaseRepertoire();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Archivo XML inválido";
        addLog(`Error al guardar en Supabase: ${message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectOnlineSong = async (songId: string) => {
    if (!songId) return;
    setSelectedRepertoireId(songId);
    setPracticeMode("repertoire");
    stepIndexRef.current = 0;
    setCurrentIndex(0);

    const found = onlineRepertoire.find((s) => s.id === songId);
    if (!found) return;

    activeSequenceRef.current = found.sequence;
    syncSequenceLeds(found.sequence, 0);
    addLog(`Cargando repertorio desde Supabase: ${found.title}...`);

    if (!found.musicXml && found.file) {
      try {
        const response = await fetch(`/${found.file.replace(/^\//, "")}`);
        if (response.ok) {
          const xmlText = await response.text();
          setOnlineRepertoire((prev) =>
            prev.map((item) => (item.id === songId ? { ...item, musicXml: xmlText } : item))
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error de red";
        addLog(`Error cargando archivo XML: ${message}`);
      }
    }
  };

  const initAudio = async () => {
    try {
      await grandPiano.load();
      setMicActive((prev) => !prev);
      addLog(
        !micActive
          ? "Micrófono y motor acústico activos para análisis."
          : "Micrófono en pausa."
      );
    } catch {
      addLog("Micrófono activo para análisis.");
    }
  };

  const changeLesson = (indexStr: string) => {
    const idx = parseInt(indexStr, 10);
    if (isNaN(idx) || idx < 0 || idx >= BEGINNER_LESSONS.length) return;
    setPracticeMode("lesson");
    setSelectedRepertoireId("");
    setCurrentLessonIndex(idx);
    stepIndexRef.current = 0;
    setCurrentIndex(0);
    activeSequenceRef.current = BEGINNER_LESSONS[idx].sequence;
    syncSequenceLeds(BEGINNER_LESSONS[idx].sequence, 0);
    addLog(`Lección cargada: ${BEGINNER_LESSONS[idx].title}`);
  };

  const restartCurrentSequence = () => {
    stepIndexRef.current = 0;
    setCurrentIndex(0);
    syncSequenceLeds(activeSequenceRef.current, 0);
    if (osmdInstanceRef.current?.cursor) {
      try {
        osmdInstanceRef.current.cursor.reset();
      } catch {}
    }
    addLog(`Secuencia reiniciada: ${activeTitle}`);
  };

  const isSequenceComplete = currentIndex >= activeSequence.length;
  const currentStep = !isSequenceComplete ? activeSequence[currentIndex] : null;
  const isHorizontalLayout = isNaturalLandscape || forcedLandscape;

  const handleUnifiedPieceSelect = (val: string) => {
    if (!val) return;
    if (val.startsWith("lesson:")) {
      changeLesson(val.replace("lesson:", ""));
    } else if (val.startsWith("cloud:")) {
      handleSelectOnlineSong(val.replace("cloud:", ""));
    }
  };

  const unifiedSelectValue =
    practiceMode === "lesson"
      ? `lesson:${currentLessonIndex}`
      : selectedRepertoireId
      ? `cloud:${selectedRepertoireId}`
      : `lesson:${currentLessonIndex}`;

  const progressPercent =
    activeSequence.length > 0
      ? Math.min(100, Math.round((currentIndex / activeSequence.length) * 100))
      : 0;

  const forcedLandscapeStyle: React.CSSProperties | undefined = forcedLandscape
    ? {
        position: "fixed",
        top: 0,
        left: "100vw",
        width: "100dvh",
        height: "100dvw",
        transform: "rotate(90deg)",
        transformOrigin: "top left",
        zIndex: 9999,
        overflow: "hidden",
      }
    : undefined;

  return (
    <div
      style={forcedLandscapeStyle}
      className="h-[100dvh] w-full overflow-hidden bg-[#090A0E] text-zinc-100 flex flex-col font-sans select-none"
    >
      {/* 1. BARRA SUPERIOR UNIFICADA — ESTILO APPLE LOGIC PRO / SKOOVE */}
      <header className="h-12 px-3 sm:px-4 bg-[#0D0F14]/90 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between gap-2 shrink-0 z-30">
        {/* Izquierda: Regreso + Identidad + Estado Hardware */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Cambiar a Estudio Vocal"
            >
              <X size={13} />
              <span className="hidden sm:inline">Vocal</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Piano size={15} />
            </div>
            <div className="hidden md:flex flex-col leading-none">
              <span className="text-xs font-semibold tracking-tight text-white">
                Alesis Studio
              </span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                {midiConnected ? midiDeviceName : "Teacher's Choice 61"}
              </span>
            </div>
          </div>

          <button
            id="btnConnectMIDI"
            type="button"
            onClick={() => initMIDI(false)}
            className={`h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
              midiConnected
                ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25"
                : "bg-white text-black hover:bg-zinc-200 border-transparent font-semibold shadow-sm"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                midiConnected ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-zinc-900"
              }`}
            />
            <Usb size={12} />
            <span>{midiConnected ? "Conectado" : "Conectar USB"}</span>
          </button>
        </div>

        {/* Centro: Selector Unificado de Lección / Partitura Cloud + Subir XML */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 max-w-md justify-center">
          <div className="relative flex-1 min-w-0">
            <select
              id="unifiedPieceSelector"
              value={unifiedSelectValue}
              onChange={(e) => handleUnifiedPieceSelect(e.target.value)}
              className="w-full h-8 pl-3 pr-7 rounded-full bg-white/[0.06] hover:bg-white/[0.09] border border-white/[0.09] text-xs font-medium text-zinc-100 outline-none focus:border-amber-500/50 truncate cursor-pointer appearance-none"
            >
              <optgroup label="Lecciones Paso a Paso" className="bg-[#12141C] text-zinc-200">
                {BEGINNER_LESSONS.map((lesson, idx) => (
                  <option key={lesson.title} value={`lesson:${idx}`}>
                    {lesson.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Biblioteca Cloud (Supabase)" className="bg-[#12141C] text-zinc-200">
                {onlineRepertoire.map((song) => (
                  <option key={song.id} value={`cloud:${song.id}`}>
                    {song.title}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px]">
              ▾
            </div>
          </div>

          <label
            className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0"
            title="Importar archivo MusicXML a Supabase"
          >
            <Upload size={13} />
            <span className="hidden lg:inline">Importar XML</span>
            <input
              type="file"
              id="scoreFile"
              accept=".xml,.musicxml"
              className="hidden"
              onChange={uploadAndLoadXML}
            />
          </label>

          <button
            type="button"
            onClick={restartCurrentSequence}
            className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Reiniciar partitura desde el inicio"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Derecha: Utilidades de Hardware y Vista */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current)}
            className="h-8 px-2.5 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Volver a iluminar la tecla actual en el piano físico"
          >
            <Lightbulb size={13} />
            <span className="hidden md:inline">Iluminar</span>
          </button>

          <button
            type="button"
            onClick={toggleHorizontalOrientation}
            className={`h-8 px-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border ${
              isHorizontalLayout
                ? "bg-white/15 border-white/25 text-white"
                : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-300"
            }`}
            title="Alternar vista Horizontal / Vertical"
          >
            <Smartphone
              size={13}
              className={isHorizontalLayout ? "rotate-90 transition-transform" : "transition-transform"}
            />
            <span className="hidden sm:inline">
              {isHorizontalLayout ? "Vertical" : "Horizontal"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalibrator((prev) => !prev)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition cursor-pointer border ${
              showCalibrator
                ? "bg-amber-500 text-black border-amber-400"
                : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.08] text-zinc-300"
            }`}
            title="Diagnóstico de luces LED y registro MIDI"
          >
            <Sliders size={13} />
          </button>
        </div>
      </header>

      {/* Banner de Permiso MIDI SysEx (solo aparece si Chrome bloqueó el permiso) */}
      {midiPermissionDenied && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-4 py-2 text-xs text-rose-200 flex items-center justify-between gap-3 shrink-0">
          <span>
            Permiso MIDI SysEx pendiente en el navegador: abre el icono de ajustes a la izquierda de la URL → Permisos → Dispositivos MIDI → Permitir y presiona Conectar USB.
          </span>
          <button
            type="button"
            onClick={() => setMidiPermissionDenied(false)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] shrink-0 cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* 2. ESCENARIO CENTRAL: GUÍA EN VIVO + PARTITURA INTERACTIVA (SIN SCROLL VERTICAL) */}
      <main className="flex-1 min-h-0 p-2 sm:p-3 flex flex-col gap-2 overflow-hidden">
        <div
          className={`flex-1 min-h-0 flex ${
            isHorizontalLayout ? "flex-row gap-2.5" : "flex-col gap-2.5"
          }`}
        >
          {/* Tarjeta de Nota Activa y Digitación (HUD limpio estilo Apple Music / Skoove) */}
          <div
            className={`${
              isHorizontalLayout
                ? "w-56 sm:w-64 shrink-0 flex flex-col justify-between p-3.5"
                : "w-full shrink-0 flex items-center justify-between px-4 py-3"
            } bg-[#11131A] border border-white/[0.08] rounded-2xl shadow-lg`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {isSequenceComplete ? "Completado" : "Nota Guía"}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {Math.min(currentIndex + 1, activeSequence.length)} / {activeSequence.length}
                </span>
              </div>

              <div
                id="songLyric"
                className={`font-bold tracking-tight mt-1.5 truncate ${
                  isHorizontalLayout ? "text-2xl" : "text-xl sm:text-2xl"
                } ${isSequenceComplete ? "text-emerald-400" : "text-white"}`}
              >
                {isSequenceComplete
                  ? "Pieza completada"
                  : `${SOLFEGE_LABELS[currentStep?.note || 60]} · ${
                      NOTE_LABELS[currentStep?.note || 60]
                    }`}
              </div>

              <p id="instructionText" className="text-xs text-zinc-400 truncate mt-0.5">
                {isSequenceComplete
                  ? "Toca cualquier tecla en tu piano para repetir"
                  : currentStep?.lyric || "Toca la tecla iluminada en ámbar"}
              </p>
            </div>

            {/* Indicador de Dedo Guía + Botón Escuchar */}
            <div
              className={`flex ${
                isHorizontalLayout
                  ? "flex-col gap-2.5 pt-2 border-t border-white/[0.06]"
                  : "items-center gap-3 shrink-0"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Digitación
                  </span>
                  <span id="handSideText" className="text-xs font-medium text-zinc-300">
                    {currentStep?.hand || "Mano Derecha"}
                  </span>
                </div>
                <div
                  id="fingerNumberBox"
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-bold border ${
                    isSequenceComplete
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {isSequenceComplete ? "✓" : currentStep?.finger ?? 1}
                </div>
              </div>

              {/* Barra de progreso sutil + botón escuchar */}
              <div className={isHorizontalLayout ? "flex flex-col gap-2" : "hidden sm:flex items-center gap-2"}>
                {currentStep && (
                  <button
                    type="button"
                    onClick={() => grandPiano.playNote(currentStep.note, 0.9)}
                    className="h-8 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Volume2 size={13} className="text-amber-400" />
                    <span>Escuchar nota</span>
                  </button>
                )}
                <div className="w-full h-1 rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visor de Partitura MusicXML (OSMD) — Ocupa todo el espacio restante */}
          <div className="flex-1 min-w-0 min-h-0 bg-[#11131A] border border-white/[0.08] rounded-2xl p-2 sm:p-3 flex flex-col shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-1 pb-1.5 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold text-zinc-200 truncate">
                  {activeTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={syncSupabaseRepertoire}
                  disabled={isSyncingSupabase}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                  title="Sincronizar biblioteca con Supabase"
                >
                  <RefreshCw size={11} className={isSyncingSupabase ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Sincronizar</span>
                </button>
              </div>
            </div>

            <div
              id="osmdContainer"
              ref={osmdContainerRef}
              className="flex-1 min-h-0 w-full bg-[#FAF9F5] rounded-xl px-2 py-1 overflow-x-auto overflow-y-hidden flex items-center justify-center text-zinc-800 shadow-inner"
            >
              <span className="text-xs text-zinc-400 font-normal text-center">
                Cargando partitura interactiva...
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. DOCK INFERIOR: TECLADO GUÍA INTERACTIVO 61 TECLAS (ESTILO LOGIC PRO) */}
      <section className="bg-[#0B0C11] border-t border-white/[0.08] px-2 sm:px-4 pt-1.5 pb-2 shrink-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-300">Teclado Guía Alesis</span>
            {currentStep && (
              <span className="text-zinc-500 font-mono">
                · {SOLFEGE_LABELS[currentStep.note]} ({NOTE_LABELS[currentStep.note]}) · Dedo{" "}
                {currentStep.finger}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <button
              type="button"
              onClick={() => testOfficialSkooveColor("orange", "ÁMBAR (0x17)")}
              className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Probar luz Ámbar (0x17) en el piano físico"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
              Ámbar
            </button>
            <button
              type="button"
              onClick={() => testOfficialSkooveColor("green", "VERDE (0x09)")}
              className="px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Probar luz Verde (0x09) en el piano físico"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              Verde
            </button>
            <button
              type="button"
              onClick={() => testOfficialSkooveColor("red", "ROJO (0x01)")}
              className="px-2.5 py-1 rounded-full bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              title="Probar luz Roja (0x01) en el piano físico"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
              Rojo
            </button>
            <button
              type="button"
              onClick={() => testOfficialSkooveColor(null, "APAGAR (0x04)")}
              className="px-2 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-zinc-400 hover:text-zinc-200 transition cursor-pointer active:scale-95"
              title="Apagar todas las luces del piano (0x04)"
            >
              Off
            </button>
          </div>
        </div>

        <div
          id="virtualKeyboard"
          ref={virtualKeyboardRef}
          className={`relative flex ${
            isHorizontalLayout ? "h-24 sm:h-28" : "h-28 sm:h-32"
          } w-full bg-[#07080C] p-1.5 rounded-xl overflow-x-auto justify-start md:justify-center items-start border border-white/[0.07]`}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {KEY_RANGE.map((midiNote) => {
            const isBlack = BLACK_KEY_NUMBERS.includes(midiNote);
            const isExpectedTarget = currentStep?.note === midiNote;
            const activeColor: LedColor =
              keyColors[midiNote] || (isExpectedTarget ? "orange" : null);

            const keyInlineStyle: React.CSSProperties = isBlack
              ? {
                  marginLeft: "-10px",
                  marginRight: "-10px",
                  backgroundColor:
                    activeColor === "red"
                      ? "#e11d48"
                      : activeColor === "green"
                      ? "#10b981"
                      : activeColor === "orange"
                      ? "#f59e0b"
                      : "#14161F",
                  color: "#ffffff",
                  borderColor:
                    activeColor === "red"
                      ? "#fda4af"
                      : activeColor === "green"
                      ? "#6ee7b7"
                      : activeColor === "orange"
                      ? "#fde68a"
                      : "#272A3A",
                  boxShadow:
                    activeColor === "red"
                      ? "0 0 16px rgba(225,29,72,0.65)"
                      : activeColor === "green"
                      ? "0 0 16px rgba(16,185,129,0.65)"
                      : activeColor === "orange"
                      ? "0 0 18px rgba(245,158,11,0.7)"
                      : undefined,
                }
              : {
                  backgroundColor:
                    activeColor === "red"
                      ? "#f43f5e"
                      : activeColor === "green"
                      ? "#10b981"
                      : activeColor === "orange"
                      ? "#f59e0b"
                      : "#F8FAFC",
                  color: activeColor ? "#ffffff" : "#0F172A",
                  borderColor:
                    activeColor === "red"
                      ? "#fda4af"
                      : activeColor === "green"
                      ? "#6ee7b7"
                      : activeColor === "orange"
                      ? "#fde68a"
                      : "#CBD5E1",
                  boxShadow:
                    activeColor === "red"
                      ? "0 0 18px rgba(244,63,94,0.6)"
                      : activeColor === "green"
                      ? "0 0 18px rgba(16,185,129,0.6)"
                      : activeColor === "orange"
                      ? "0 0 20px rgba(245,158,11,0.65)"
                      : undefined,
                };

            return (
              <div
                key={midiNote}
                id={`key-${midiNote}`}
                ref={(el) => {
                  keyElementRefs.current[midiNote] = el;
                }}
                onClick={() => evaluateUserNote(midiNote)}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                style={keyInlineStyle}
                className={
                  isBlack
                    ? `relative z-20 ${
                        isHorizontalLayout ? "h-14 w-5" : "h-16 sm:h-18 w-5 sm:w-6"
                      } rounded-b-md cursor-pointer border flex flex-col items-center justify-between py-1 text-[8px] font-mono shrink-0 transition-all select-none active:scale-95`
                    : `relative z-10 ${
                        isHorizontalLayout
                          ? "h-20 sm:h-24 flex-1 min-w-[28px]"
                          : "h-24 sm:h-28 w-9 sm:w-10 shrink-0"
                      } rounded-b-lg cursor-pointer border flex flex-col items-center justify-between py-1.5 text-[9px] font-semibold shadow-sm transition-all select-none active:scale-95`
                }
              >
                {/* Indicador LED Superior */}
                <div className="flex flex-col items-center">
                  <span
                    className="w-2 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor:
                        activeColor === "orange"
                          ? "#fffbeb"
                          : activeColor === "green"
                          ? "#ecfdf5"
                          : activeColor === "red"
                          ? "#fff1f2"
                          : isBlack
                          ? "#1E2230"
                          : "#E2E8F0",
                      boxShadow: activeColor ? "0 0 6px #ffffff" : "none",
                    }}
                  />
                  {activeColor === "orange" && currentStep && (
                    <span
                      className="mt-0.5 px-1 rounded text-[8px] font-bold leading-tight"
                      style={{ backgroundColor: "rgba(9,10,15,0.85)", color: "#fbbf24" }}
                    >
                      D{currentStep.finger}
                    </span>
                  )}
                </div>

                {/* Etiqueta de Nota */}
                <div className="flex flex-col items-center leading-tight">
                  <span className="font-bold text-[9px]">{SOLFEGE_LABELS[midiNote]}</span>
                  <span className="opacity-75 text-[7px] font-mono">{NOTE_LABELS[midiNote]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. MODAL FLOTANTE DE DIAGNÓSTICO HARDWARE LED & LOGS (OCULTO POR DEFECTO) */}
      {showCalibrator && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#12141D] border border-white/[0.1] rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Diagnóstico de Iluminación Alesis
                </h3>
                <p className="text-xs text-zinc-400">
                  {sysexEnabled
                    ? "Control SysEx de 3 colores activo (Ámbar 0x17 · Verde 0x09 · Rojo 0x01)"
                    : "Conecta el cable USB-C y permite el acceso MIDI para probar las luces"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalibrator(false)}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => testOfficialSkooveColor("orange", "ÁMBAR (0x17)")}
                className="py-2 px-3 rounded-xl font-semibold bg-amber-500 hover:bg-amber-400 text-black text-xs transition cursor-pointer"
              >
                Ámbar (0x17)
              </button>
              <button
                type="button"
                onClick={() => testOfficialSkooveColor("green", "VERDE (0x09)")}
                className="py-2 px-3 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-black text-xs transition cursor-pointer"
              >
                Verde (0x09)
              </button>
              <button
                type="button"
                onClick={() => testOfficialSkooveColor("red", "ROJO (0x01)")}
                className="py-2 px-3 rounded-xl font-semibold bg-rose-500 hover:bg-rose-400 text-white text-xs transition cursor-pointer"
              >
                Rojo (0x01)
              </button>
              <button
                type="button"
                onClick={() => testOfficialSkooveColor(null, "APAGAR (0x04)")}
                className="py-2 px-3 rounded-xl font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 text-xs border border-white/[0.08] transition cursor-pointer"
              >
                Apagar (0x04)
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Terminal size={12} /> Registro de eventos MIDI
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLogs([`[${new Date().toLocaleTimeString()}] Registro reiniciado.`])
                  }
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
              <div
                id="logConsole"
                ref={logConsoleRef}
                className="bg-black/60 p-2.5 rounded-xl font-mono text-[10px] text-zinc-300 h-28 overflow-y-auto border border-white/[0.06] space-y-1"
              >
                {logs.map((entry, idx) => (
                  <div key={`${idx}-${entry}`}>{entry}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
