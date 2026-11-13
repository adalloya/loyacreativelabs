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

// Modos de iluminación física para el Alesis Teacher's Choice 61
// "guide_vel1": Usa Velocity = 1 (confirmado en hardware) para encender siempre la TECLA A TOCAR (expectedNote), apagándola al acertar y encendiendo la siguiente.
// "channels_123": Envía Vel=1 en Canal 1 (0x90), Canal 2 (0x91) o Canal 3 (0x92).
// "vel_123": Envía Vel 3 / 2 / 1 en Canal 1.
type Tc61HardwareMode = "guide_vel1" | "channels_123" | "vel_123";

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

  // Por defecto usamos "guide_vel1": envía la señal confirmada a la tecla objetivo,
  // mezcla Canal 1+2+3 (Vel=1) para buscar Ámbar/Verde, y enciende en Rojo (Ch1 Vel=1) cuando te equivocas.
  const [hardwareMode, setHardwareMode] = useState<Tc61HardwareMode>("guide_vel1");
  const [showCalibrator, setShowCalibrator] = useState<boolean>(true);
  const [customOrangeCmd, setCustomOrangeCmd] = useState<{ status: number; vel: number } | null>(
    null
  );
  const [customGreenCmd, setCustomGreenCmd] = useState<{ status: number; vel: number } | null>(
    null
  );
  const [lastScannedNote, setLastScannedNote] = useState<{
    note: number;
    status: number;
    vel: number;
    desc: string;
  } | null>(null);
  const activeScanMapRef = useRef<
    Record<number, { status: number; vel: number; desc: string }>
  >({});

  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string>("");
  const [micActive, setMicActive] = useState<boolean>(false);
  const [osmdReady, setOsmdReady] = useState<boolean>(false);

  const [isNaturalLandscape, setIsNaturalLandscape] = useState<boolean>(false);
  const [forcedLandscape, setForcedLandscape] = useState<boolean>(false);

  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [Sistema] Estudio Alesis Teacher's Choice 61 listo. Escáner de 61 teclas activo para detectar Naranja y Verde.`,
  ]);

  const midiOutputsRef = useRef<MIDIOutput[]>([]);
  const midiInputsRef = useRef<MIDIInput[]>([]);
  const litHardwareNotesRef = useRef<Set<number>>(new Set());
  const hardwareModeRef = useRef<Tc61HardwareMode>(hardwareMode);
  const customOrangeRef = useRef<{ status: number; vel: number } | null>(null);
  const customGreenRef = useRef<{ status: number; vel: number } | null>(null);

  useEffect(() => {
    hardwareModeRef.current = hardwareMode;
  }, [hardwareMode]);

  useEffect(() => {
    customOrangeRef.current = customOrangeCmd;
  }, [customOrangeCmd]);

  useEffect(() => {
    customGreenRef.current = customGreenCmd;
  }, [customGreenCmd]);

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

  // Enviar comando MIDI crudo al teclado físico
  const sendRawMidiToHardware = useCallback(
    (statusByte: number, noteNumber: number, velocity: number) => {
      const outputs = midiOutputsRef.current;
      if (!outputs || outputs.length === 0) return;

      if (velocity <= 0) {
        litHardwareNotesRef.current.delete(noteNumber);
        for (const out of outputs) {
          try {
            for (let ch = 0; ch < 16; ch++) {
              out.send([0x80 + ch, noteNumber, 0]);
              out.send([0x90 + ch, noteNumber, 0]);
            }
          } catch {}
        }
        return;
      }

      litHardwareNotesRef.current.add(noteNumber);
      for (const out of outputs) {
        try {
          out.send([statusByte, noteNumber, velocity]);
        } catch {}
      }
    },
    []
  );

  // Control de los 3 colores del LED físico del Alesis Teacher's Choice 61:
  const sendHardwareLedMidi = useCallback(
    (noteNumber: number, color: LedColor) => {
      if (color === null) {
        sendRawMidiToHardware(0x90, noteNumber, 0);
        return;
      }

      if (color === "red") {
        // Rojo confirmado al 100% en tu Alesis Teacher's Choice 61: Canal 1 (0x90) con Velocity = 1
        sendRawMidiToHardware(0x91, noteNumber, 0);
        sendRawMidiToHardware(0x92, noteNumber, 0);
        sendRawMidiToHardware(0x90, noteNumber, 1);
        return;
      }

      if (color === "green") {
        if (customGreenRef.current) {
          sendRawMidiToHardware(0x90, noteNumber, 0);
          sendRawMidiToHardware(customGreenRef.current.status, noteNumber, customGreenRef.current.vel);
          return;
        }
        // Apagar Rojo (Canal 1) y encender Verde en Canal 2 (0x91, Vel=1) + Vel=64
        const outputs = midiOutputsRef.current;
        for (const out of outputs) {
          try {
            out.send([0x80, noteNumber, 0]);
            out.send([0x90, noteNumber, 0]);
            out.send([0x91, noteNumber, 1]);
            out.send([0x90, noteNumber, 64]);
          } catch {}
        }
        litHardwareNotesRef.current.add(noteNumber);
        return;
      }

      // color === "orange" (Tecla objetivo a presionar)
      if (customOrangeRef.current) {
        sendRawMidiToHardware(0x90, noteNumber, 0);
        sendRawMidiToHardware(customOrangeRef.current.status, noteNumber, customOrangeRef.current.vel);
        return;
      }

      const mode = hardwareModeRef.current;

      if (mode === "channels_123") {
        // Solo Canal 3 (0x92) con Velocity = 1 (sin enviar Canal 1 Rojo)
        const outputs = midiOutputsRef.current;
        for (const out of outputs) {
          try {
            out.send([0x90, noteNumber, 0]);
            out.send([0x91, noteNumber, 0]);
            out.send([0x92, noteNumber, 1]);
          } catch {}
        }
        litHardwareNotesRef.current.add(noteNumber);
        return;
      }

      if (mode === "vel_123") {
        // Solo Canal 2 (0x91) con Velocity = 1 (sin enviar Canal 1 Rojo)
        const outputs = midiOutputsRef.current;
        for (const out of outputs) {
          try {
            out.send([0x90, noteNumber, 0]);
            out.send([0x92, noteNumber, 0]);
            out.send([0x91, noteNumber, 1]);
          } catch {}
        }
        litHardwareNotesRef.current.add(noteNumber);
        return;
      }

      // Modo por defecto "guide_vel1":
      // Envía Canal 1 (0x90, Vel=1) + Canal 2 (0x91, Vel=1) + Canal 3 (0x92, Vel=1)
      // Así garantiza que la tecla a tocar SIEMPRE se ilumine y mezcla Rojo+Verde=Ámbar si el teclado lo soporta
      const outputs = midiOutputsRef.current;
      for (const out of outputs) {
        try {
          out.send([0x90, noteNumber, 1]);
          out.send([0x91, noteNumber, 1]);
          out.send([0x92, noteNumber, 1]);
        } catch {}
      }
      litHardwareNotesRef.current.add(noteNumber);
    },
    [sendRawMidiToHardware]
  );

  // Encender en el piano físico y en pantalla la nota objetivo actual
  const syncSequenceLeds = useCallback(
    (sequence: LessonStep[], stepIdx: number) => {
      activeScanMapRef.current = {};
      const previouslyLit = Array.from(litHardwareNotesRef.current);
      for (const prevNote of previouslyLit) {
        sendRawMidiToHardware(0x90, prevNote, 0);
      }

      if (stepIdx < sequence.length) {
        const targetNote = sequence[stepIdx].note;
        setKeyColors({ [targetNote]: "orange" });
        centerKeyInVirtualKeyboard(targetNote);
        sendHardwareLedMidi(targetNote, "orange");

        setTimeout(() => {
          centerKeyInVirtualKeyboard(targetNote);
          sendHardwareLedMidi(targetNote, "orange");
        }, 45);
      } else {
        setKeyColors({});
      }
    },
    [centerKeyInVirtualKeyboard, sendHardwareLedMidi, sendRawMidiToHardware]
  );

  useEffect(() => {
    syncSequenceLeds(activeSequence, currentIndex);
  }, [
    activeSequence,
    currentIndex,
    hardwareMode,
    customOrangeCmd,
    customGreenCmd,
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

      // Si el usuario acaba de ejecutar un Escaneo de 61 teclas y toca en su piano una tecla que prendió en Naranja o Verde:
      const scannedInfo = activeScanMapRef.current[playedNote];
      if (scannedInfo) {
        setLastScannedNote({
          note: playedNote,
          status: scannedInfo.status,
          vel: scannedInfo.vel,
          desc: scannedInfo.desc,
        });
        addLog(
          `🎯 Detectada tecla física MIDI ${playedNote} (${
            SOLFEGE_LABELS[playedNote] || NOTE_LABELS[playedNote] || playedNote
          }): ${scannedInfo.desc}`
        );
      }

      const sequence = activeSequenceRef.current;
      const idx = stepIndexRef.current;

      if (idx >= sequence.length) {
        setKeyColors({ [playedNote]: "green" });
        setTimeout(() => {
          stepIndexRef.current = 0;
          setCurrentIndex(0);
        }, 300);
        return;
      }

      const expectedNote = sequence[idx].note;

      if (playedNote === expectedNote) {
        const nextIdx = idx + 1;
        stepIndexRef.current = nextIdx;

        // 1. En pantalla y en el piano físico enviamos la señal de VERDE
        setKeyColors({ [expectedNote]: "green" });
        sendHardwareLedMidi(expectedNote, "green");

        addLog(`✓ Correcto: ${sequence[idx].name} con Dedo ${sequence[idx].finger}`);
        if (osmdInstanceRef.current?.cursor) {
          try {
            osmdInstanceRef.current.cursor.next();
          } catch {}
        }

        // 2. Tras 240ms apagamos la nota anterior y encendemos la SIGUIENTE tecla objetivo
        setTimeout(() => {
          sendHardwareLedMidi(expectedNote, null);
          setCurrentIndex(nextIdx);
          if (nextIdx < sequence.length) {
            const nextNote = sequence[nextIdx].note;
            setKeyColors({ [nextNote]: "orange" });
            centerKeyInVirtualKeyboard(nextNote);
            sendHardwareLedMidi(nextNote, "orange");
          }
        }, 240);
      } else {
        // Si tocó una tecla equivocada:
        // 1. En pantalla y en el piano físico encendemos en ROJO ([0x90, playedNote, 1]) la tecla equivocada
        // y mantenemos encendida la tecla correcta (expectedNote)
        setKeyColors({
          [expectedNote]: "orange",
          [playedNote]: "red",
        });
        centerKeyInVirtualKeyboard(expectedNote);

        sendHardwareLedMidi(playedNote, "red");
        sendHardwareLedMidi(expectedNote, "orange");

        addLog(
          `✕ Incorrecto (${NOTE_LABELS[playedNote] || playedNote} en Rojo). Toca ${
            sequence[idx].name
          }.`
        );

        // 2. A los 380ms apagamos el Rojo de la tecla equivocada y dejamos encendida la tecla objetivo
        setTimeout(() => {
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
        }, 380);
      }
    },
    [addLog, centerKeyInVirtualKeyboard, sendHardwareLedMidi]
  );

  const evaluateUserNoteRef = useRef(evaluateUserNote);
  useEffect(() => {
    evaluateUserNoteRef.current = evaluateUserNote;
  }, [evaluateUserNote]);

  // Inicializar Web MIDI API (USB-C Bidireccional con Alesis Teacher's Choice 61)
  const initMIDI = async () => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      alert("Web MIDI no soportado en este navegador. Usa Chrome en Android o Desktop.");
      addLog("Error: Web MIDI API no soportada en este navegador.");
      return;
    }

    try {
      let midiAccess: MIDIAccess;
      try {
        midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      } catch {
        midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      }

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
            await out.open();
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
            await inp.open();
          }
        } catch {}
        inp.onmidimessage = (event: MIDIMessageEvent) => {
          if (!event.data || event.data.length < 3) return;
          const [status, note, velocity] = event.data;
          const command = status >> 4;
          if (command === 9 && velocity > 0) {
            evaluateUserNoteRef.current(note);
          } else if (command === 8 || (command === 9 && velocity === 0)) {
            if (Object.keys(activeScanMapRef.current).length === 0) {
              const seq = activeSequenceRef.current;
              const idx = stepIndexRef.current;
              if (idx < seq.length) {
                const targetNote = seq[idx].note;
                setTimeout(() => {
                  sendHardwareLedMidi(targetNote, "orange");
                }, 30);
              }
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
          `Alesis conectado (${activeInputs.length} IN / ${activeOutputs.length} OUT): ${deviceLabel}.`
        );
      } else {
        addLog("Acceso MIDI concedido, pero no se detectó el cable USB-C del teclado.");
      }

      syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      addLog(`Error MIDI: ${message}`);
    }
  };

  // Apagar todas las 61 teclas del piano físico
  const clearAll61Keys = useCallback(() => {
    const outputs = midiOutputsRef.current;
    for (const out of outputs) {
      try {
        for (let note = 36; note <= 96; note++) {
          out.send([0x80, note, 0]);
          out.send([0x90, note, 0]);
          out.send([0x91, note, 0]);
          out.send([0x92, note, 0]);
        }
      } catch {}
    }
    litHardwareNotesRef.current.clear();
  }, []);

  // ESCANEO 1: Prueba los 16 Canales MIDI (1..16) con Velocity=1 en las teclas 48..63 (Do3 a Re#4)
  const runChannelScan16 = () => {
    clearAll61Keys();
    const scanMap: Record<number, { status: number; vel: number; desc: string }> = {};
    const outputs = midiOutputsRef.current;
    for (let ch = 0; ch < 16; ch++) {
      const note = 48 + ch; // Do3 (48) = Canal 1, Do#3 (49) = Canal 2, Re3 (50) = Canal 3...
      const status = 0x90 + ch;
      scanMap[note] = {
        status,
        vel: 1,
        desc: `Canal ${ch + 1} (0x${status.toString(16).toUpperCase()}) • Vel 1`,
      };
      for (const out of outputs) {
        try {
          out.send([status, note, 1]);
        } catch {}
      }
      litHardwareNotesRef.current.add(note);
    }
    activeScanMapRef.current = scanMap;
    addLog(
      "🌈 Scan 1 enviado: Teclas Do3(48) a Re#4(63) tienen Canales 1 al 16 con Vel=1. ¡Mira tu piano y presiona cualquier tecla que haya prendido en Naranja o Verde!"
    );
  };

  // ESCANEO 2: Prueba las Velocidades 1 a 61 simultáneamente en las 61 teclas del piano (36..96) en Canal 1 (0x90)
  const runVelocityScan1To61 = () => {
    clearAll61Keys();
    const scanMap: Record<number, { status: number; vel: number; desc: string }> = {};
    const outputs = midiOutputsRef.current;
    for (let i = 0; i < 61; i++) {
      const note = 36 + i; // 36 (Do2) a 96 (Do7)
      const vel = 1 + i; // Vel 1 a 61
      scanMap[note] = {
        status: 0x90,
        vel,
        desc: `Canal 1 (0x90) • Velocidad ${vel}`,
      };
      for (const out of outputs) {
        try {
          out.send([0x90, note, vel]);
        } catch {}
      }
      litHardwareNotesRef.current.add(note);
    }
    activeScanMapRef.current = scanMap;
    addLog(
      "🌈 Scan 2 enviado: Las 61 teclas tienen Velocidades 1 a 61 (Do2=Vel 1). ¡Mira tu piano y presiona cualquier tecla que brille en Naranja o Verde!"
    );
  };

  // ESCANEO 3: Prueba las Velocidades 62 a 127 simultáneamente en las 61 teclas del piano (36..96) en Canal 1 (0x90)
  const runVelocityScan62To127 = () => {
    clearAll61Keys();
    const scanMap: Record<number, { status: number; vel: number; desc: string }> = {};
    const outputs = midiOutputsRef.current;
    for (let i = 0; i < 61; i++) {
      const note = 36 + i; // 36 a 96
      const vel = Math.min(127, 62 + i + (i >= 5 ? 5 : 0)); // Cubre 62..66 y 72..127 (incluyendo 64 y 127)
      const exactVel = i === 2 ? 64 : i === 60 ? 127 : Math.min(127, 62 + i);
      scanMap[note] = {
        status: 0x90,
        vel: exactVel,
        desc: `Canal 1 (0x90) • Velocidad ${exactVel}`,
      };
      for (const out of outputs) {
        try {
          out.send([0x90, note, exactVel]);
        } catch {}
      }
      litHardwareNotesRef.current.add(note);
    }
    activeScanMapRef.current = scanMap;
    addLog(
      "🌈 Scan 3 enviado: Las 61 teclas tienen Velocidades 62 a 127 (incluyendo 64 y 127). ¡Presiona en tu piano cualquier tecla que brille en Naranja o Verde!"
    );
  };

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
    addLog(`Lección cargada: ${BEGINNER_LESSONS[idx].title}`);
  };

  const restartCurrentSequence = () => {
    stepIndexRef.current = 0;
    setCurrentIndex(0);
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
        overflowY: "auto",
        overflowX: "hidden",
      }
    : undefined;

  return (
    <div
      style={forcedLandscapeStyle}
      className={`${
        isEmbedded && !forcedLandscape ? "h-full w-full overflow-y-auto" : "min-h-screen w-full"
      } bg-slate-950 text-slate-100 flex flex-col font-sans select-none`}
    >
      {/* Header Compacto Mobile-First y Ultra-Slim en Modo Horizontal */}
      <header
        className={`bg-slate-900/95 backdrop-blur-md border-b border-slate-800 ${
          isHorizontalLayout ? "px-3 py-1.5 gap-1.5" : "p-3 gap-2"
        } flex flex-col shadow-md sticky top-0 z-40`}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow">
              <Piano size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-base font-bold text-orange-400 truncate">
                  🎹 Alesis Teacher&apos;s Choice 61 Studio
                </h1>
                {midiConnected && (
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    USB-C Activo
                  </span>
                )}
              </div>
              {!isHorizontalLayout && (
                <p className="text-[10px] text-slate-400 truncate">
                  {midiConnected
                    ? `Conectado: ${midiDeviceName} • Luz Guía Activa (Vel 1)`
                    : "Luz Guía Directa en Teclado Físico (Vel 1) + Partituras Supabase"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleHorizontalOrientation}
              className={`active:scale-95 text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-semibold transition shadow flex items-center gap-1 cursor-pointer border ${
                isHorizontalLayout
                  ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200"
              }`}
              title="Rotar aplicación en Horizontal / Vertical"
            >
              <Smartphone
                size={13}
                className={
                  isHorizontalLayout
                    ? "rotate-90 text-amber-400 transition-transform"
                    : "transition-transform"
                }
              />
              <span>{isHorizontalLayout ? "Vertical" : "🔄 Horizontal"}</span>
            </button>

            <button
              id="btnConnectMIDI"
              type="button"
              onClick={initMIDI}
              className={`active:scale-95 text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-semibold transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                midiConnected
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <Usb size={13} />
              <span>{midiConnected ? "MIDI OK" : "🔌 Conectar USB"}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                title="Volver al Estudio Vocal"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Barra de acciones secundarias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          <label className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow text-white">
            <Upload size={12} />
            <span>📂 Cargar y Subir a Supabase</span>
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
            onClick={() => syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current)}
            className="bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shadow flex items-center gap-1 cursor-pointer"
          >
            <Lightbulb size={12} />
            <span>💡 Prender Tecla Actual en Piano</span>
          </button>

          <button
            type="button"
            onClick={restartCurrentSequence}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap shadow flex items-center gap-1 text-slate-200 border border-slate-700 cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Repetir</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalibrator((prev) => !prev)}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap shadow flex items-center gap-1 text-orange-300 border border-orange-500/30 cursor-pointer"
          >
            <Sliders size={12} />
            <span>Opciones LED</span>
          </button>

          <button
            type="button"
            onClick={initAudio}
            className={`active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap shadow flex items-center gap-1 cursor-pointer ${
              micActive
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Mic size={12} />
            <span>{micActive ? "Mic ON" : "Micrófono"}</span>
          </button>

          <button
            type="button"
            onClick={syncSupabaseRepertoire}
            disabled={isSyncingSupabase}
            className="bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 active:scale-95 text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition whitespace-nowrap flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={11} className={isSyncingSupabase ? "animate-spin" : ""} />
            <span>Actualizar Cloud</span>
          </button>
        </div>

        {/* Escáner de las 61 Teclas para detectar Naranja y Verde en el Alesis Teacher's Choice 61 */}
        {showCalibrator && (
          <div className="bg-slate-950/95 border border-orange-500/40 rounded-xl p-2.5 flex flex-col gap-2 text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-orange-300">
                🌈 Escáner 61 Teclas (Toca un botón y mira qué teclas prenden en Naranja o Verde en tu piano):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={runChannelScan16}
                  className="px-2.5 py-1 rounded-lg font-bold bg-orange-500 hover:bg-orange-400 text-slate-950 cursor-pointer shadow"
                >
                  1️⃣ Scan Canales 1-16 (Do3 a Re#4)
                </button>
                <button
                  type="button"
                  onClick={runVelocityScan1To61}
                  className="px-2.5 py-1 rounded-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow"
                >
                  2️⃣ Scan Vel 1-61 (Las 61 Teclas)
                </button>
                <button
                  type="button"
                  onClick={runVelocityScan62To127}
                  className="px-2.5 py-1 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow"
                >
                  3️⃣ Scan Vel 62-127 (Las 61 Teclas)
                </button>
                <button
                  type="button"
                  onClick={() => syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current)}
                  className="px-2 py-1 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  Volver a Lección
                </button>
              </div>
            </div>

            {lastScannedNote && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5">
                <span className="text-emerald-300 font-mono text-[11px]">
                  🎯 Tocaste tecla <b>{SOLFEGE_LABELS[lastScannedNote.note] || lastScannedNote.note}</b> →{" "}
                  <b>{lastScannedNote.desc}</b>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomOrangeCmd({
                        status: lastScannedNote.status,
                        vel: lastScannedNote.vel,
                      });
                      addLog(`🟠 Color Naranja asignado a: ${lastScannedNote.desc}`);
                    }}
                    className="px-2.5 py-1 rounded bg-orange-500 text-slate-950 font-bold text-[10px] cursor-pointer"
                  >
                    🟠 Usar este para Naranja
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGreenCmd({
                        status: lastScannedNote.status,
                        vel: lastScannedNote.vel,
                      });
                      addLog(`🟢 Color Verde asignado a: ${lastScannedNote.desc}`);
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-bold text-[10px] cursor-pointer"
                  >
                    🟢 Usar este para Verde
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">
                  Modo de nota a tocar:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomOrangeCmd(null);
                    setCustomGreenCmd(null);
                    setHardwareMode("guide_vel1");
                  }}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer border ${
                    hardwareMode === "guide_vel1" && !customOrangeCmd
                      ? "bg-orange-500 text-slate-950 border-orange-300"
                      : "bg-slate-900 text-slate-300 border-slate-700"
                  }`}
                >
                  Mix Ch1+2+3 (Vel=1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomOrangeCmd(null);
                    setHardwareMode("channels_123");
                  }}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer border ${
                    hardwareMode === "channels_123" && !customOrangeCmd
                      ? "bg-orange-500 text-slate-950 border-orange-300"
                      : "bg-slate-900 text-slate-300 border-slate-700"
                  }`}
                >
                  Solo Canal 3 (0x92 Vel=1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomOrangeCmd(null);
                    setHardwareMode("vel_123");
                  }}
                  className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer border ${
                    hardwareMode === "vel_123" && !customOrangeCmd
                      ? "bg-emerald-500 text-slate-950 border-emerald-300"
                      : "bg-slate-900 text-slate-300 border-slate-700"
                  }`}
                >
                  Solo Canal 2 (0x91 Vel=1)
                </button>
              </div>
              <span className="text-[10px] text-slate-400">
                Al tocar un botón Scan (1, 2 o 3), si ves alguna tecla en <b>Naranja</b> o <b>Verde</b> en tu piano, presiónala en el piano para guardarla.
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Contenido Principal — Se adapta automáticamente a modo Vertical o Cockpit Horizontal */}
      <main
        className={`flex-1 ${
          isHorizontalLayout
            ? "p-2 max-w-full flex flex-col gap-2 pb-4"
            : "p-3 sm:p-5 max-w-4xl mx-auto w-full flex flex-col gap-3.5 pb-12"
        }`}
      >
        {/* 1. Selectores + Estado Activo + Dedo Guía + Partitura OSMD */}
        <div
          className={
            isHorizontalLayout
              ? "grid grid-cols-12 gap-2 items-stretch"
              : "flex flex-col gap-3.5"
          }
        >
          <div
            className={
              isHorizontalLayout
                ? "col-span-5 flex flex-col gap-2 justify-between"
                : "flex flex-col gap-3"
            }
          >
            {/* Selectores Cloud + Lecciones */}
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`bg-slate-900 border rounded-xl p-2.5 shadow flex flex-col gap-1 ${
                  practiceMode === "repertoire" ? "border-orange-500/60" : "border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1 truncate">
                    <Cloud size={10} /> ☁️ Cloud Supabase
                  </span>
                </div>
                <select
                  id="cloudSongSelector"
                  value={practiceMode === "repertoire" ? selectedRepertoireId : ""}
                  onChange={(e) => handleSelectOnlineSong(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none focus:border-orange-500 font-medium cursor-pointer"
                >
                  <option value="">Elegir partitura cloud...</option>
                  {onlineRepertoire.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`bg-slate-900 border rounded-xl p-2.5 shadow flex flex-col gap-1 ${
                  practiceMode === "lesson" ? "border-purple-500/60" : "border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1 truncate">
                    <BookOpen size={10} /> 📚 Lecciones
                  </span>
                </div>
                <select
                  id="lessonSelector"
                  value={practiceMode === "lesson" ? currentLessonIndex : ""}
                  onChange={(e) => changeLesson(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-[11px] text-slate-200 rounded-lg p-1.5 outline-none focus:border-purple-500 font-medium cursor-pointer"
                >
                  {BEGINNER_LESSONS.map((lesson, idx) => (
                    <option key={lesson.title} value={idx}>
                      {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Banner de Nota Objetivo */}
            <div className="bg-slate-900 border border-orange-500/40 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    TECLA ILUMINADA EN TU PIANO
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate">
                    Paso {Math.min(currentIndex + 1, activeSequence.length)}/{activeSequence.length}
                  </span>
                </div>
                <div
                  id="songLyric"
                  className={`text-lg sm:text-xl font-black mt-1 truncate ${
                    isSequenceComplete ? "text-emerald-400" : "text-orange-400"
                  }`}
                >
                  {isSequenceComplete
                    ? "¡Pieza completada! 🎉"
                    : `${currentStep?.name || "C4 (Do)"} — ${currentStep?.lyric || "Dedo 1"}`}
                </div>
                <div id="instructionText" className="text-[11px] text-slate-300 truncate">
                  {isSequenceComplete
                    ? "Toca cualquier tecla para reiniciar o elige otra partitura."
                    : `Presiona la tecla con luz en tu piano (${NOTE_LABELS[currentStep?.note || 60]} / ${
                        SOLFEGE_LABELS[currentStep?.note || 60]
                      })`}
                </div>
              </div>

              {/* Recuadro de Digitación (Dedo Guía integrado) */}
              <div className="flex flex-col items-center shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Dedo Guía
                </span>
                <div
                  id="fingerNumberBox"
                  className="w-11 h-11 rounded-xl border-2 flex items-center justify-center text-2xl font-black my-0.5"
                  style={{
                    backgroundColor: isSequenceComplete
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(249, 115, 22, 0.25)",
                    borderColor: isSequenceComplete ? "#22c55e" : "#f97316",
                    color: isSequenceComplete ? "#4ade80" : "#fb923c",
                  }}
                >
                  {isSequenceComplete ? "✓" : currentStep?.finger ?? 1}
                </div>
                <span id="handSideText" className="text-[9px] font-semibold text-slate-300">
                  {currentStep?.hand || "Mano Der."}
                </span>
              </div>
            </div>
          </div>

          {/* Partitura Interactiva MusicXML (OSMD) */}
          <div
            className={
              isHorizontalLayout
                ? "col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between shadow-inner"
                : "bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-inner"
            }
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-purple-400" /> Partitura MusicXML (OSMD)
              </span>
              <div className="flex items-center gap-2">
                {currentStep && (
                  <button
                    type="button"
                    onClick={() => grandPiano.playNote(currentStep.note, 0.9)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Volume2 size={11} /> Escuchar Nota
                  </button>
                )}
                <span className="text-[10px] font-mono text-purple-300 truncate max-w-[160px]">
                  {activeTitle}
                </span>
              </div>
            </div>
            <div
              id="osmdContainer"
              ref={osmdContainerRef}
              className={`bg-white rounded-xl p-1.5 overflow-x-auto ${
                isHorizontalLayout ? "h-24" : "min-h-[115px] max-h-[175px]"
              } flex items-center justify-center text-slate-800 shadow-inner`}
            >
              <span className="text-xs text-slate-400 font-normal text-center">
                Cargando visor de partituras OSMD...
              </span>
            </div>
          </div>
        </div>

        {/* 2. TECLADO TÁCTIL / MONITOR ALESIS USB-C */}
        <div className="bg-slate-900 border border-orange-500/30 rounded-2xl p-2.5 sm:p-3.5 flex flex-col items-center shadow-xl">
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                🎹 Teclado Guía Alesis (C3 a E5)
              </span>
              {currentStep && (
                <span
                  onClick={() => syncSequenceLeds(activeSequenceRef.current, stepIndexRef.current)}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold cursor-pointer animate-pulse"
                  style={{
                    backgroundColor: "#f97316",
                    color: "#090a0f",
                    boxShadow: "0 0 12px #f97316",
                  }}
                >
                  👉 Tecla encendida en tu piano: {NOTE_LABELS[currentStep.note]} (
                  {SOLFEGE_LABELS[currentStep.note]}) • Dedo {currentStep.finger}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-300 font-medium">
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: "#f97316", boxShadow: "0 0 8px #f97316" }}
                />
                Tecla a tocar (Luz Activa en Piano)
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e" }}
                />
                Correcta (Avanza a la siguiente)
              </span>
              <span className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: "#ef4444", boxShadow: "0 0 8px #ef4444" }}
                />
                Error
              </span>
            </div>
          </div>

          <div
            id="virtualKeyboard"
            ref={virtualKeyboardRef}
            className={`relative flex ${
              isHorizontalLayout ? "h-28 sm:h-32" : "h-32 sm:h-36"
            } w-full bg-slate-950 p-2 rounded-xl overflow-x-auto justify-start md:justify-center items-start border border-slate-800`}
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
                        ? "#ef4444"
                        : activeColor === "green"
                        ? "#22c55e"
                        : activeColor === "orange"
                        ? "#f97316"
                        : "#0f172a",
                    color: "#ffffff",
                    borderColor:
                      activeColor === "red"
                        ? "#fca5a5"
                        : activeColor === "green"
                        ? "#86efac"
                        : activeColor === "orange"
                        ? "#fed7aa"
                        : "#334155",
                    boxShadow:
                      activeColor === "red"
                        ? "0 0 20px #ef4444, inset 0 0 8px rgba(255,255,255,0.5)"
                        : activeColor === "green"
                        ? "0 0 20px #22c55e, inset 0 0 8px rgba(255,255,255,0.5)"
                        : activeColor === "orange"
                        ? "0 0 24px #f97316, 0 0 10px #fb923c, inset 0 0 10px rgba(255,255,255,0.6)"
                        : undefined,
                  }
                : {
                    backgroundColor:
                      activeColor === "red"
                        ? "#ef4444"
                        : activeColor === "green"
                        ? "#22c55e"
                        : activeColor === "orange"
                        ? "#f97316"
                        : "#ffffff",
                    color: activeColor ? "#ffffff" : "#0f172a",
                    borderColor:
                      activeColor === "red"
                        ? "#fca5a5"
                        : activeColor === "green"
                        ? "#86efac"
                        : activeColor === "orange"
                        ? "#ffedd5"
                        : "#cbd5e1",
                    boxShadow:
                      activeColor === "red"
                        ? "0 0 22px #ef4444, inset 0 0 10px rgba(255,255,255,0.5)"
                        : activeColor === "green"
                        ? "0 0 22px #22c55e, inset 0 0 10px rgba(255,255,255,0.5)"
                        : activeColor === "orange"
                        ? "0 0 26px #f97316, 0 0 12px #fb923c, inset 0 0 12px rgba(255,255,255,0.55)"
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
                          isHorizontalLayout ? "h-16 w-5" : "h-16 sm:h-20 w-5 sm:w-6"
                        } rounded-b-md cursor-pointer border-2 flex flex-col items-center justify-between py-1 text-[8px] font-mono shrink-0 transition-all select-none active:scale-95`
                      : `relative z-10 ${
                          isHorizontalLayout
                            ? "h-24 sm:h-28 flex-1 min-w-[28px]"
                            : "h-28 sm:h-32 w-9 sm:w-10 shrink-0"
                        } rounded-b-lg cursor-pointer border-2 flex flex-col items-center justify-between py-1.5 text-[9px] font-semibold shadow-sm transition-all select-none active:scale-95`
                  }
                >
                  {/* Bombillo LED superior en cada tecla */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        activeColor === "orange" ? "animate-ping" : ""
                      }`}
                      style={{
                        backgroundColor:
                          activeColor === "orange"
                            ? "#fff7ed"
                            : activeColor === "green"
                            ? "#dcfce7"
                            : activeColor === "red"
                            ? "#fee2e2"
                            : isBlack
                            ? "#1e293b"
                            : "#e2e8f0",
                        boxShadow: activeColor ? "0 0 8px #ffffff" : "none",
                      }}
                    />
                    {activeColor === "orange" && currentStep && (
                      <span
                        className="mt-0.5 px-1 py-0.2 rounded text-[8px] font-black leading-tight"
                        style={{ backgroundColor: "#090a0f", color: "#fb923c" }}
                      >
                        D{currentStep.finger}
                      </span>
                    )}
                  </div>

                  {/* Nombre de la Nota (Solfeo + Inglés) */}
                  <div className="flex flex-col items-center leading-tight">
                    <span className="font-black text-[9px]">{SOLFEGE_LABELS[midiNote]}</span>
                    <span className="opacity-85 text-[7px] font-mono">{NOTE_LABELS[midiNote]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Consola de Sistema MIDI & OSMD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-emerald-400" /> Log de Sistema MIDI / OSMD / Supabase
            </span>
            <button
              type="button"
              onClick={() =>
                setLogs([`[${new Date().toLocaleTimeString()}] [Sistema] Consola limpia.`])
              }
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition cursor-pointer"
            >
              Limpiar
            </button>
          </div>
          <div
            id="logConsole"
            ref={logConsoleRef}
            className={`bg-slate-950 p-2 rounded-xl font-mono text-[10px] text-emerald-400 ${
              isHorizontalLayout ? "h-14" : "h-20"
            } overflow-y-auto border border-slate-800 space-y-0.5`}
          >
            {logs.map((entry, idx) => (
              <div key={`${idx}-${entry}`}>{entry}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
