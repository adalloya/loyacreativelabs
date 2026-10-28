// Motor Matemático Musical, Detector de Pitch (Autocorrelación Normalizada NSDF / McLeod) y Sintetizador Web Audio

export interface PitchData {
  frequency: number;
  midi: number;
  midiFloat: number;
  noteName: string;
  noteLetter: string;
  angloName?: string;
  angloLetter?: string;
  octave: number;
  cents: number;
  clarity: number;
  rms: number;
  timestamp: number;
}

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const SOLFEGE_NAMES = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

export const SOLFEGE_TO_ANGLO: Record<string, string> = {
  Do: "C",
  "Do#": "C#",
  Re: "D",
  "Re#": "D#",
  Mi: "E",
  Fa: "F",
  "Fa#": "F#",
  Sol: "G",
  "Sol#": "G#",
  La: "A",
  "La#": "A#",
  Si: "B",
};

export interface VocalRegisterInfo {
  id: "chest" | "mixed" | "head";
  name: string;
  shortName: string;
  description: string;
  color: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
}

export function getVocalRegister(midi: number): VocalRegisterInfo {
  if (midi < 54) {
    // Menor a F#3 (hasta Fa3): Voz de Pecho
    return {
      id: "chest",
      name: "Voz de Pecho",
      shortName: "Pecho",
      description: "Resonancia pectoral y graves con apoyo de diafragma.",
      color: "#5E5CE6", // Indigo Apple
      badgeBg: "rgba(94, 92, 230, 0.16)",
      textColor: "#A3A0FB",
      borderColor: "rgba(94, 92, 230, 0.35)",
    };
  } else if (midi <= 65) {
    // F#3 (54) a F4 (65): Voz Mixta / Passaggio
    return {
      id: "mixed",
      name: "Voz Mixta (Passaggio)",
      shortName: "Voz Mixta",
      description: "Puente vocal y mezcla equilibrada de resonadores.",
      color: "#BF5AF2", // Purple Apple
      badgeBg: "rgba(191, 90, 242, 0.16)",
      textColor: "#E097FF",
      borderColor: "rgba(191, 90, 242, 0.35)",
    };
  } else {
    // Mayor a F4 (desde F#4 en adelante): Voz de Cabeza / Falsete
    return {
      id: "head",
      name: "Voz de Cabeza / Falsete",
      shortName: "Cabeza / Falsete",
      description: "Resonancia craneal, paladar blando elevado y agudos.",
      color: "#FF9F0A", // Amber Apple
      badgeBg: "rgba(255, 159, 10, 0.16)",
      textColor: "#FFD080",
      borderColor: "rgba(255, 159, 10, 0.35)",
    };
  }
}

export function freqToPitchData(frequency: number, clarity: number, rms: number): PitchData {
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteLetter = SOLFEGE_NAMES[noteIndex];
  const angloLetter = NOTE_NAMES[noteIndex];
  const noteName = `${noteLetter}${octave}`;
  const angloName = `${angloLetter}${octave}`;

  return {
    frequency: Math.round(frequency * 10) / 10,
    midi,
    midiFloat,
    noteName,
    noteLetter,
    angloName,
    angloLetter,
    octave,
    cents,
    clarity: Math.round(clarity * 100) / 100,
    rms,
    timestamp: performance.now(),
  };
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi: number, notation: "solfege" | "anglo" | "both" = "solfege"): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const solf = `${SOLFEGE_NAMES[noteIndex]}${octave}`;
  const anglo = `${NOTE_NAMES[noteIndex]}${octave}`;
  if (notation === "anglo") return anglo;
  if (notation === "both") return `${solf} (${anglo})`;
  return solf;
}

/**
 * Algoritmo McLeod Pitch Method (NSDF) en tiempo real para detección de voz humana sin saltos de octava
 */
export function detectPitchMcLeod(buffer: Float32Array, sampleRate: number): { freq: number; clarity: number; rms: number } {
  const size = buffer.length;
  let rms = 0;
  for (let i = 0; i < size; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / size);

  // Umbral de silencio (Noise Gate inteligente)
  if (rms < 0.008) {
    return { freq: 0, clarity: 0, rms };
  }

  // Rango vocal humano: 65 Hz (C2) a 1100 Hz (C#6)
  const minTau = Math.floor(sampleRate / 1100);
  const maxTau = Math.min(Math.floor(sampleRate / 65), Math.floor(size / 2));

  const nsdf = new Float32Array(maxTau);
  for (let tau = minTau; tau < maxTau; tau++) {
    let acf = 0;
    let divisorM = 0;
    for (let i = 0; i < size - tau; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    nsdf[tau] = divisorM > 0 ? (2 * acf) / divisorM : 0;
  }

  // Encontrar máximos locales tras cruces por cero positivos
  const maxPositions: number[] = [];
  let highestAmplitude = -1;

  for (let tau = minTau + 1; tau < maxTau - 1; tau++) {
    if (nsdf[tau] > 0.4 && nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) {
      maxPositions.push(tau);
      if (nsdf[tau] > highestAmplitude) {
        highestAmplitude = nsdf[tau];
      }
    }
  }

  if (maxPositions.length === 0 || highestAmplitude < 0.55) {
    return { freq: 0, clarity: 0, rms };
  }

  // Seleccionar el primer pico que supere el 88% del pico global (evita errores de armónicos/octava)
  const threshold = 0.88 * highestAmplitude;
  let chosenTau = maxPositions[0];
  for (const tau of maxPositions) {
    if (nsdf[tau] >= threshold) {
      chosenTau = tau;
      break;
    }
  }

  // Interpolación parabólica para precisión sub-sample (cents exactos)
  const x0 = chosenTau > 1 ? chosenTau - 1 : chosenTau;
  const x2 = chosenTau + 1 < maxTau ? chosenTau + 1 : chosenTau;
  let refinedTau = chosenTau;
  if (x0 !== chosenTau && x2 !== chosenTau) {
    const s0 = nsdf[x0];
    const s1 = nsdf[chosenTau];
    const s2 = nsdf[x2];
    const denom = 2 * s1 - s2 - s0;
    if (denom !== 0) {
      refinedTau = chosenTau + (s2 - s0) / (2 * denom);
    }
  }

  const freq = sampleRate / refinedTau;
  const clarity = Math.min(1, Math.max(0, nsdf[chosenTau]));

  return { freq, clarity, rms };
}

/**
 * Sintetizador de Piano / Warmup Studio (Web Audio API puro con armónicos cálidos tipo Rhodes/Grand Piano)
 */
class AppleVocalSynth {
  private ctx: AudioContext | null = null;
  private activeOscillators: Map<number, { stop: () => void }> = new Map();

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public playNote(midi: number, durationSeconds = 0.65, volume = 0.28) {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freq = midiToFreq(midi);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.55, now + 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    // Filtro cálido tipo piano acústico
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 4.5, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + durationSeconds);

    // Oscilador fundamental + armónico de calidez
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "triangle";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now); // Octava suave

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.18, now);

    osc1.connect(filter);
    osc2.connect(osc2Gain);
    osc2Gain.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSeconds + 0.05);
    osc2.stop(now + durationSeconds + 0.05);
  }

  public startSustainedNote(midi: number, volume = 0.25) {
    this.stopSustainedNote(midi);
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freq = midiToFreq(midi);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.03);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(4, now); // Ligero chorus cálido

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);

    this.activeOscillators.set(midi, {
      stop: () => {
        if (!this.ctx) return;
        const stopTime = this.ctx.currentTime;
        gain.gain.cancelScheduledValues(stopTime);
        gain.gain.setValueAtTime(gain.gain.value, stopTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.12);
        osc1.stop(stopTime + 0.15);
        osc2.stop(stopTime + 0.15);
      },
    });
  }

  public stopSustainedNote(midi: number) {
    const active = this.activeOscillators.get(midi);
    if (active) {
      active.stop();
      this.activeOscillators.delete(midi);
    }
  }

  public stopAll() {
    this.activeOscillators.forEach((v) => v.stop());
    this.activeOscillators.clear();
  }

  public playChord(midiNotes: number[], durationSeconds = 2.4, volume = 0.16) {
    midiNotes.forEach((midi, idx) => {
      // Arpeggiate notes slightly for a realistic acoustic strum/piano feel
      setTimeout(() => {
        this.playNote(midi, durationSeconds, volume);
      }, idx * 30);
    });
  }
}

export function chordNameToMidi(chordName: string): number[] {
  const rootMap: Record<string, number> = {
    C: 48, "C#": 49, Db: 49, D: 50, "D#": 51, Eb: 51,
    E: 52, F: 53, "F#": 54, Gb: 54, G: 55, "G#": 56, Ab: 56,
    A: 57, "A#": 58, Bb: 58, B: 59,
  };

  // Extraer el primer acorde si es una progresión (ej. 'Em → B7')
  const cleanChord = chordName.split(/[\s→/-]/)[0].trim();
  const match = cleanChord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [40, 52, 55, 59]; // Em por defecto

  const root = rootMap[match[1]] || 52;
  const suffix = match[2].trim().toLowerCase();

  if (suffix === "m" || suffix === "min") {
    return [root - 12, root, root + 3, root + 7, root + 12];
  } else if (suffix === "m7" || suffix === "min7") {
    return [root - 12, root, root + 3, root + 7, root + 10];
  } else if (suffix === "7" || suffix === "dom7") {
    return [root - 12, root, root + 4, root + 7, root + 10];
  } else if (suffix === "maj7" || suffix === "m7+") {
    return [root - 12, root, root + 4, root + 7, root + 11];
  } else if (suffix === "dim" || suffix === "dim7") {
    return [root - 12, root, root + 3, root + 6, root + 9];
  } else if (suffix === "sus4") {
    return [root - 12, root, root + 5, root + 7, root + 12];
  } else {
    // Mayor estándar
    return [root - 12, root, root + 4, root + 7, root + 12];
  }
}

export const vocalSynth = new AppleVocalSynth();
