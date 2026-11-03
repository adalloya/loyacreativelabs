"use client";

// Motor de Sonido de Grand Piano de Estudio Real (Salamander Grand Piano Samples + Web Audio Synth Fallback)

const SALAMANDER_BASE_URL = "https://tonejs.github.io/audio/salamander/";

const SALAMANDER_SAMPLE_MAP: Record<string, string> = {
  A0: "A0.mp3",
  C1: "C1.mp3",
  "D#1": "Ds1.mp3",
  "F#1": "Fs1.mp3",
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
  C7: "C7.mp3",
  "D#7": "Ds7.mp3",
  "F#7": "Fs7.mp3",
  A7: "A7.mp3",
  C8: "C8.mp3",
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToToneNote(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function toneNoteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60;
  const [, letter, octStr] = match;
  const noteIndex = NOTE_NAMES.indexOf(letter);
  const octave = parseInt(octStr, 10);
  return (octave + 1) * 12 + noteIndex;
}

class GrandPianoEngine {
  private toneSampler: any = null;
  private toneModule: any = null;
  private fallbackAudioCtx: AudioContext | null = null;
  private activeFallbackOscs: Map<number, { gain: GainNode; stop: () => void }> = new Map();

  private _isLoaded = false;
  private _isLoading = false;
  private _sustain = false;
  private sustainedNotes: Set<number> = new Set();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Inicialización perezosa al primer gesto de usuario
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  public get isSustained(): boolean {
    return this._sustain;
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public setSustain(sustain: boolean) {
    this._sustain = sustain;
    if (!sustain) {
      // Liberar notas sostenidas
      this.sustainedNotes.forEach((midi) => {
        this.triggerRelease(midi, true);
      });
      this.sustainedNotes.clear();
    }
    this.notify();
  }

  /**
   * Carga las muestras reales del Salamander Grand Piano vía Tone.js
   */
  public async load(): Promise<void> {
    if (this._isLoaded || this._isLoading || typeof window === "undefined") return;

    this._isLoading = true;
    this.notify();

    try {
      const Tone = await import("tone");
      this.toneModule = Tone;

      await Tone.start();

      return new Promise<void>((resolve) => {
        this.toneSampler = new Tone.Sampler({
          urls: SALAMANDER_SAMPLE_MAP,
          baseUrl: SALAMANDER_BASE_URL,
          release: 1.2,
          onload: () => {
            this._isLoaded = true;
            this._isLoading = false;
            this.notify();
            resolve();
          },
        }).toDestination();
      });
    } catch (err) {
      console.warn("[GrandPianoEngine] No se pudieron cargar muestras Salamander, usando fallback sintético Rhodes/Grand:", err);
      this._isLoaded = false;
      this._isLoading = false;
      this.notify();
    }
  }

  private initFallbackCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.fallbackAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.fallbackAudioCtx = new AudioCtx();
    }
    if (this.fallbackAudioCtx.state === "suspended") {
      this.fallbackAudioCtx.resume().catch(() => {});
    }
    return this.fallbackAudioCtx;
  }

  /**
   * Dispara una nota (ataque)
   */
  public triggerAttack(midi: number, velocity = 0.85) {
    if (typeof window === "undefined") return;

    // Asegurar contexto activo de Tone.js
    if (this.toneModule && this.toneModule.context.state !== "running") {
      this.toneModule.start().catch(() => {});
    }

    if (this._isLoaded && this.toneSampler) {
      try {
        const noteName = midiToToneNote(midi);
        this.toneSampler.triggerAttack(noteName, undefined, velocity);
        return;
      } catch (err) {
        // Fallback a oscilador si ocurre error
      }
    }

    // Fallback sintetizado puro de alta calidez
    const ctx = this.initFallbackCtx();
    if (!ctx) return;

    // Detener nota previa si existía
    this.triggerRelease(midi, true);

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(velocity * 0.35, now + 0.015);
    // Decaimiento natural de piano
    masterGain.gain.exponentialRampToValueAtTime(velocity * 0.18, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.min(freq * 5.5, 9000), now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 1.2);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();

    osc1.type = "triangle";
    osc2.type = "sine";
    osc3.type = "sine";

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now); // Octava
    osc3.frequency.setValueAtTime(freq * 3, now); // 5ta armónica

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    const g3 = ctx.createGain();

    g1.gain.value = 0.7;
    g2.gain.value = 0.22;
    g3.gain.value = 0.08;

    osc1.connect(g1);
    osc2.connect(g2);
    osc3.connect(g3);

    g1.connect(filter);
    g2.connect(filter);
    g3.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    this.activeFallbackOscs.set(midi, {
      gain: masterGain,
      stop: () => {
        try {
          const stopTime = ctx.currentTime + 0.15;
          masterGain.gain.cancelScheduledValues(ctx.currentTime);
          masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);
          setTimeout(() => {
            try {
              osc1.stop();
              osc2.stop();
              osc3.stop();
              osc1.disconnect();
              osc2.disconnect();
              osc3.disconnect();
              masterGain.disconnect();
            } catch {}
          }, 200);
        } catch {}
      },
    });
  }

  /**
   * Libera una nota (release)
   */
  public triggerRelease(midi: number, force = false) {
    if (this._sustain && !force) {
      this.sustainedNotes.add(midi);
      return;
    }

    if (this._isLoaded && this.toneSampler) {
      try {
        const noteName = midiToToneNote(midi);
        this.toneSampler.triggerRelease(noteName);
      } catch {}
    }

    const fallback = this.activeFallbackOscs.get(midi);
    if (fallback) {
      fallback.stop();
      this.activeFallbackOscs.delete(midi);
    }
    this.sustainedNotes.delete(midi);
  }

  /**
   * Toca una nota completa con duración en segundos
   */
  public playNote(noteOrMidi: number | string, durationSeconds = 0.7, velocity = 0.85) {
    const midi = typeof noteOrMidi === "number" ? noteOrMidi : toneNoteToMidi(noteOrMidi);
    this.triggerAttack(midi, velocity);
    setTimeout(() => {
      this.triggerRelease(midi, true);
    }, Math.max(100, durationSeconds * 1000));
  }

  /**
   * Toca un acorde polifónico simultáneo
   */
  public playChord(midis: number[], durationSeconds = 1.0, velocity = 0.75) {
    midis.forEach((m) => this.triggerAttack(m, velocity));
    setTimeout(() => {
      midis.forEach((m) => this.triggerRelease(m, true));
    }, Math.max(100, durationSeconds * 1000));
  }

  /**
   * Libera todas las notas activas
   */
  public releaseAll() {
    if (this._isLoaded && this.toneSampler) {
      try {
        this.toneSampler.releaseAll();
      } catch {}
    }
    this.activeFallbackOscs.forEach((inst) => inst.stop());
    this.activeFallbackOscs.clear();
    this.sustainedNotes.clear();
  }
}

// Singleton global de Grand Piano
export const grandPiano = new GrandPianoEngine();
