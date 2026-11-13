"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { grandPiano } from "@/audio/grandPianoEngine";
import {
  Usb,
  Upload,
  Mic,
  RotateCcw,
  CheckCircle2,
  Piano,
  BookOpen,
  Terminal,
  X,
  Volume2,
  Sparkles,
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

// Declaración global para OpenSheetMusicDisplay cargado desde CDN
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

// Generador de MusicXML válido para que las lecciones también puedan visualizarse en OSMD
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

// Inicializar MusicXML para cada lección
BEGINNER_LESSONS.forEach((lesson) => {
  lesson.musicXml = buildLessonMusicXML(lesson.title, lesson.sequence);
});

const BLACK_KEY_NUMBERS = [49, 51, 54, 56, 58, 61, 63, 66, 68, 70];
const KEY_RANGE = Array.from({ length: 72 - 48 + 1 }, (_, idx) => 48 + idx);

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
};

interface AlesisPianoStudioSectionProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

export default function AlesisPianoStudioSection({
  onClose,
  isEmbedded = false,
}: AlesisPianoStudioSectionProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [keyColors, setKeyColors] = useState<Record<number, LedColor>>({});
  const [midiConnected, setMidiConnected] = useState<boolean>(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string>("");
  const [micActive, setMicActive] = useState<boolean>(false);
  const [osmdReady, setOsmdReady] = useState<boolean>(false);
  const [customXmlLoaded, setCustomXmlLoaded] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [Sistema] Listo. Conecta tu cable USB-C.`,
  ]);

  const midiOutputRef = useRef<MIDIOutput | null>(null);
  const midiInputRef = useRef<MIDIInput | null>(null);
  const osmdContainerRef = useRef<HTMLDivElement | null>(null);
  const osmdInstanceRef = useRef<{
    load: (xml: string) => Promise<void>;
    render: () => void;
    cursor?: { show: () => void; next: () => void; reset: () => void };
  } | null>(null);
  const logConsoleRef = useRef<HTMLDivElement | null>(null);
  const keyElementRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Refs sincronizados para que el callback nativo onmidimessage siempre lea el estado actual
  const lessonIndexRef = useRef<number>(currentLessonIndex);
  const stepIndexRef = useRef<number>(currentIndex);

  useEffect(() => {
    lessonIndexRef.current = currentLessonIndex;
  }, [currentLessonIndex]);

  useEffect(() => {
    stepIndexRef.current = currentIndex;
  }, [currentIndex]);

  const addLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  }, []);

  // Auto-scroll del log de sistema
  useEffect(() => {
    if (logConsoleRef.current) {
      logConsoleRef.current.scrollTop = logConsoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Cargar librería OpenSheetMusicDisplay desde CDN si no está en window
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

  // Función estricta de control de color en pantalla + LED físico vía MIDI Velocity
  const setKeyColor = useCallback((noteNumber: number, color: LedColor) => {
    setKeyColors((prev) => {
      const next = { ...prev };
      if (color === null) {
        delete next[noteNumber];
      } else {
        next[noteNumber] = color;
      }
      return next;
    });

    const keyEl = keyElementRefs.current[noteNumber];
    if (keyEl && color) {
      try {
        keyEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      } catch {
        // Fallback seguro
      }
    }

    if (midiOutputRef.current) {
      const velocity =
        color === "red" ? 1 : color === "green" ? 5 : color === "orange" ? 10 : 0;
      try {
        midiOutputRef.current.send([0x90, noteNumber, velocity]);
      } catch {
        // Fallback si el puerto MIDI se desconectó
      }
    }
  }, []);

  // Limpiar todos los LEDs de una secuencia y encender la nota objetivo en Naranja
  const syncLessonLeds = useCallback(
    (lessonIdx: number, stepIdx: number) => {
      const sequence = BEGINNER_LESSONS[lessonIdx].sequence;
      // Apagar todas las teclas del rango en MIDI y UI
      setKeyColors({});
      sequence.forEach((s) => {
        if (midiOutputRef.current) {
          try {
            midiOutputRef.current.send([0x90, s.note, 0]);
          } catch {}
        }
      });

      if (stepIdx < sequence.length) {
        const targetNote = sequence[stepIdx].note;
        setKeyColor(targetNote, "orange");
      }
    },
    [setKeyColor]
  );

  // Actualizar iluminación cada vez que cambia la lección o el paso actual
  useEffect(() => {
    syncLessonLeds(currentLessonIndex, currentIndex);
  }, [currentLessonIndex, currentIndex, syncLessonLeds]);

  // Renderizar partitura de la lección actual en OSMD si no se ha subido un XML externo personalizado
  useEffect(() => {
    if (!osmdReady || !osmdContainerRef.current || customXmlLoaded) return;
    const lesson = BEGINNER_LESSONS[currentLessonIndex];
    if (!lesson?.musicXml || !window.opensheetmusicdisplay) return;

    const renderLessonScore = async () => {
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
        await instance.load(lesson.musicXml);
        instance.render();
        if (instance.cursor) {
          instance.cursor.show();
          instance.cursor.reset();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al renderizar partitura";
        addLog(`Aviso OSMD: ${message}`);
      }
    };

    renderLessonScore();
  }, [osmdReady, currentLessonIndex, customXmlLoaded, addLog]);

  // Evaluar nota tocada por el usuario (vía MIDI USB-C o toque en pantalla)
  const evaluateUserNote = useCallback(
    (playedNote: number) => {
      // Sonar piano acústico de estudio al tocar la nota
      grandPiano.playNote(playedNote, 0.85);

      const activeLesson = BEGINNER_LESSONS[lessonIndexRef.current];
      const sequence = activeLesson.sequence;
      const idx = stepIndexRef.current;

      if (idx >= sequence.length) return;
      const expectedNote = sequence[idx].note;

      if (playedNote === expectedNote) {
        setKeyColor(expectedNote, "green");
        addLog(`✓ Correcto: ${sequence[idx].name} con Dedo ${sequence[idx].finger}`);
        if (osmdInstanceRef.current?.cursor) {
          try {
            osmdInstanceRef.current.cursor.next();
          } catch {}
        }
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
        }, 350);
      } else {
        setKeyColor(playedNote, "red");
        setKeyColor(expectedNote, "orange");
        addLog(
          `✕ Nota errónea (${NOTE_LABELS[playedNote] || playedNote}). Se esperaba ${sequence[idx].name}.`
        );
        setTimeout(() => {
          setKeyColor(playedNote, null);
          setKeyColor(expectedNote, "orange");
        }, 400);
      }
    },
    [setKeyColor, addLog]
  );

  // Mantener ref de evaluateUserNote para listener MIDI
  const evaluateUserNoteRef = useRef(evaluateUserNote);
  useEffect(() => {
    evaluateUserNoteRef.current = evaluateUserNote;
  }, [evaluateUserNote]);

  // Inicializar Web MIDI API (USB-C Bidireccional con Alesis)
  const initMIDI = async () => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      alert("Web MIDI no soportado en este navegador. Usa Chrome en Android o Desktop.");
      addLog("Error: Web MIDI API no soportada en este navegador.");
      return;
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: true });
      let foundOutput: MIDIOutput | null = null;
      let foundInput: MIDIInput | null = null;

      for (const output of midiAccess.outputs.values()) {
        const name = (output.name || "").toLowerCase();
        if (name.includes("alesis") || name.includes("usb audio") || name.includes("midi")) {
          foundOutput = output;
          break;
        }
      }

      for (const input of midiAccess.inputs.values()) {
        const name = (input.name || "").toLowerCase();
        if (name.includes("alesis") || name.includes("usb audio") || name.includes("midi")) {
          foundInput = input;
          break;
        }
      }

      if (!foundOutput) {
        for (const output of midiAccess.outputs.values()) {
          foundOutput = output;
          break;
        }
      }

      if (!foundInput) {
        for (const input of midiAccess.inputs.values()) {
          foundInput = input;
          break;
        }
      }

      midiOutputRef.current = foundOutput;
      midiInputRef.current = foundInput;

      if (foundInput) {
        foundInput.onmidimessage = (event: MIDIMessageEvent) => {
          if (!event.data || event.data.length < 3) return;
          const [status, note, velocity] = event.data;
          if (status >> 4 === 9 && velocity > 0) {
            evaluateUserNoteRef.current(note);
          }
        };
      }

      const deviceLabel =
        foundInput?.name || foundOutput?.name || "Controlador USB-C MIDI Genérico";
      setMidiConnected(Boolean(foundInput || foundOutput));
      setMidiDeviceName(deviceLabel);

      if (foundInput || foundOutput) {
        addLog(`Teclado MIDI conectado con éxito: ${deviceLabel}`);
      } else {
        addLog("Acceso MIDI concedido, pero no se detectaron puertos USB conectados.");
      }

      syncLessonLeds(lessonIndexRef.current, stepIndexRef.current);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      addLog(`Error MIDI: ${message}`);
    }
  };

  // Cargar archivo MusicXML externo (.xml, .musicxml) en OSMD
  const loadMusicXML = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const xmlContent = e.target?.result;
      if (typeof xmlContent !== "string") return;

      try {
        if (!osmdContainerRef.current || !window.opensheetmusicdisplay) {
          addLog("Error: El motor OSMD aún no está disponible.");
          return;
        }
        setCustomXmlLoaded(file.name);
        osmdContainerRef.current.innerHTML = "";
        const instance = new window.opensheetmusicdisplay.OpenSheetMusicDisplay(
          osmdContainerRef.current,
          {
            autoResize: true,
            backend: "svg",
            drawFingerings: true,
          }
        );
        osmdInstanceRef.current = instance;
        await instance.load(xmlContent);
        instance.render();
        if (instance.cursor) {
          instance.cursor.show();
        }
        addLog(`Partitura XML cargada correctamente: ${file.name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Archivo XML inválido";
        addLog(`Error XML: ${message}`);
      }
    };
    reader.readAsText(file);
  };

  // Activar micrófono para análisis acústico complementario
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
    setCustomXmlLoaded(null);
    setCurrentLessonIndex(idx);
    setCurrentIndex(0);
    addLog(`Lección cargada: ${BEGINNER_LESSONS[idx].title}`);
  };

  const restartCurrentLesson = () => {
    setCurrentIndex(0);
    if (osmdInstanceRef.current?.cursor) {
      try {
        osmdInstanceRef.current.cursor.reset();
      } catch {}
    }
    addLog(`Lección reiniciada: ${BEGINNER_LESSONS[currentLessonIndex].title}`);
  };

  const activeLesson = BEGINNER_LESSONS[currentLessonIndex];
  const lessonSequence = activeLesson.sequence;
  const isLessonComplete = currentIndex >= lessonSequence.length;
  const currentStep = !isLessonComplete ? lessonSequence[currentIndex] : null;

  return (
    <div
      className={`${
        isEmbedded ? "h-full w-full overflow-y-auto" : "min-h-screen w-full"
      } bg-slate-950 text-slate-100 flex flex-col font-sans select-none`}
    >
      {/* Header Compacto Mobile-First */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 flex flex-col gap-2.5 shadow-md sticky top-0 z-40">
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 shrink-0 shadow">
              <Piano size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-orange-400 truncate">
                  🎹 Alesis Piano Academy
                </h1>
                {midiConnected && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    USB-C Activo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {midiConnected
                  ? `Conectado: ${midiDeviceName}`
                  : "Master Studio - USB-C MIDI, LEDs 3 Colores & OSMD"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btnConnectMIDI"
              type="button"
              onClick={initMIDI}
              className={`active:scale-95 text-xs px-3 py-2 rounded-xl font-semibold transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                midiConnected
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <Usb size={14} />
              <span>{midiConnected ? "MIDI Conectado" : "🔌 Conectar USB"}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                title="Volver al Estudio Vocal"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Barra de acciones secundarias con touch-scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          <label className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-xs px-3 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow text-white">
            <Upload size={13} />
            <span>📂 Cargar XML</span>
            <input
              type="file"
              id="scoreFile"
              accept=".xml,.musicxml"
              className="hidden"
              onChange={loadMusicXML}
            />
          </label>

          <button
            type="button"
            onClick={initAudio}
            className={`active:scale-95 text-xs px-3 py-2 rounded-xl font-medium transition whitespace-nowrap shadow flex items-center gap-1.5 cursor-pointer ${
              micActive
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            <Mic size={13} />
            <span>🎤 {micActive ? "Micrófono ON" : "Micrófono"}</span>
          </button>

          <button
            type="button"
            onClick={restartCurrentLesson}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs px-3 py-2 rounded-xl font-medium transition whitespace-nowrap shadow flex items-center gap-1.5 text-slate-200 border border-slate-700 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Repetir Lección</span>
          </button>

          {customXmlLoaded && (
            <button
              type="button"
              onClick={() => setCustomXmlLoaded(null)}
              className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs px-3 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer"
            >
              Ver Partitura de Lección
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal Mobile-First y adaptable a Desktop */}
      <main className="flex-1 p-3 sm:p-5 max-w-4xl mx-auto w-full flex flex-col gap-4 pb-12">
        {/* 1. Selector de Lecciones */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <BookOpen size={12} /> 📚 Módulo de Aprendizaje
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">
              {activeLesson.level} • Paso {Math.min(currentIndex + 1, lessonSequence.length)}/
              {lessonSequence.length}
            </span>
          </div>
          <select
            id="lessonSelector"
            value={currentLessonIndex}
            onChange={(e) => changeLesson(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs sm:text-sm text-slate-200 rounded-xl p-2.5 outline-none focus:border-orange-500 font-medium cursor-pointer"
          >
            {BEGINNER_LESSONS.map((lesson, idx) => (
              <option key={lesson.title} value={idx}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Estado de Lección Activa & Leyenda de 3 Colores LED */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg relative flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Práctica Activa
            </span>
            {currentStep && (
              <button
                type="button"
                onClick={() => grandPiano.playNote(currentStep.note, 0.9)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 flex items-center gap-1 transition cursor-pointer"
              >
                <Volume2 size={11} /> Escuchar Nota
              </button>
            )}
          </div>

          <div
            id="songLyric"
            className={`text-xl sm:text-2xl font-black my-1 transition-all ${
              isLessonComplete ? "text-emerald-400" : "text-orange-400"
            }`}
          >
            {isLessonComplete
              ? "¡Lección completada con éxito! 🎉"
              : currentStep?.lyric || '"Conecta tu teclado Alesis"'}
          </div>

          <div id="instructionText" className="text-xs sm:text-sm text-slate-300">
            {isLessonComplete
              ? "Selecciona otra lección o pulsa Repetir Lección para practicar de nuevo."
              : `Toca ${currentStep?.name} en tu teclado Alesis o en el monitor táctil (Naranja)`}
          </div>

          {isLessonComplete && (
            <button
              type="button"
              onClick={restartCurrentLesson}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
            >
              <CheckCircle2 size={14} /> Practicar de Nuevo
            </button>
          )}

          {/* Indicadores de los 3 estados del motor pedagógico */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 w-full flex justify-center gap-5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
              Siguiente (Vel 10)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
              Bien (Vel 5)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              Error (Vel 1)
            </span>
          </div>
        </div>

        {/* 3. Panel Dueto: Recuadro Dedicado de Posición de Dedos (Fingering) + Partitura MusicXML (OSMD) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Recuadro de Digitación (1 al 5) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col items-center justify-center text-center sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Dedo Guía (Fingering)
            </span>
            <div
              id="fingerNumberBox"
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black shadow-inner transition-all ${
                isLessonComplete
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                  : "bg-orange-500/20 border-orange-500 text-orange-400"
              }`}
            >
              {isLessonComplete ? "✓" : currentStep?.finger ?? "-"}
            </div>
            <div id="handSideText" className="text-xs font-semibold text-slate-300 mt-2">
              {currentStep?.hand || "Mano Der."}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5">
              1: Pulgar • 2: Índice • 3: Medio • 4: Anular • 5: Meñique
            </span>
          </div>

          {/* Visor de Partituras MusicXML (OSMD) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col shadow-inner sm:col-span-2 justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-purple-400" /> Partitura Interactiva MusicXML (OSMD)
              </span>
              {customXmlLoaded && (
                <span className="text-[10px] font-mono text-purple-300 truncate max-w-[160px]">
                  {customXmlLoaded}
                </span>
              )}
            </div>
            <div
              id="osmdContainer"
              ref={osmdContainerRef}
              className="bg-white rounded-xl p-2 overflow-x-auto min-h-[120px] max-h-[180px] flex items-center justify-center text-slate-800 shadow-inner"
            >
              <span className="text-xs text-slate-400 font-normal text-center">
                Cargando visor de partituras OSMD...
              </span>
            </div>
          </div>
        </div>

        {/* 4. Teclado Táctil / Monitor Alesis USB-C (En Vivo con auto-scroll) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-lg">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Teclado Alesis USB-C (En Vivo — Notas MIDI 48 a 72)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Toca cualquier tecla para probar
            </span>
          </div>

          <div
            id="virtualKeyboard"
            className="relative flex h-28 sm:h-32 w-full bg-slate-950 p-2.5 rounded-xl overflow-x-auto justify-start sm:justify-center items-start border border-slate-800/80"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {KEY_RANGE.map((midiNote) => {
              const isBlack = BLACK_KEY_NUMBERS.includes(midiNote);
              const activeColor = keyColors[midiNote] || null;

              const colorClasses =
                activeColor === "red"
                  ? "!bg-[#ef4444] !text-white !border-red-400 shadow-[0_0_15px_#ef4444]"
                  : activeColor === "green"
                  ? "!bg-[#22c55e] !text-white !border-emerald-400 shadow-[0_0_15px_#22c55e]"
                  : activeColor === "orange"
                  ? "!bg-[#f97316] !text-white !border-orange-300 shadow-[0_0_15px_#f97316]"
                  : "";

              return (
                <div
                  key={midiNote}
                  id={`key-${midiNote}`}
                  ref={(el) => {
                    keyElementRefs.current[midiNote] = el;
                  }}
                  onClick={() => evaluateUserNote(midiNote)}
                  style={isBlack ? { marginLeft: "-10px", marginRight: "-10px" } : undefined}
                  className={
                    isBlack
                      ? `z-10 h-16 sm:h-20 w-5 sm:w-6 bg-slate-900 text-slate-100 rounded-b-md cursor-pointer border border-slate-700 flex flex-col items-center justify-end pb-1.5 text-[8px] font-mono shrink-0 transition-all select-none active:scale-95 ${colorClasses}`
                      : `relative z-0 h-24 sm:h-28 w-8 sm:w-10 bg-white text-slate-900 rounded-b-lg cursor-pointer border border-slate-300 flex flex-col items-center justify-end pb-1.5 text-[9px] font-semibold shadow-sm shrink-0 transition-all select-none active:scale-95 ${colorClasses}`
                  }
                >
                  <span className="opacity-75 text-[7px] font-mono">
                    {NOTE_LABELS[midiNote]}
                  </span>
                  <span className="font-bold">{midiNote}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Consola de Sistema MIDI & OSMD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={12} className="text-emerald-400" /> Log de Sistema MIDI / OSMD
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
            className="bg-slate-950 p-2.5 rounded-xl font-mono text-[10px] text-emerald-400 h-24 overflow-y-auto border border-slate-800 space-y-0.5"
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
