// src/audio/grandPianoEngine.ts
import * as Tone from 'tone';

type NoteListener = (activeNotes: Set<number>) => void;

export const SOLFEGE_MAP: Record<string, string> = {
  'C': 'Do', 'C#': 'Do#', 'D': 'Re', 'D#': 'Re#', 'E': 'Mi', 'F': 'Fa',
  'F#': 'Fa#', 'G': 'Sol', 'G#': 'Sol#', 'A': 'La', 'A#': 'La#', 'B': 'Si'
};

export function midiToNoteInfo(midi: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[((midi % 12) + 12) % 12];
  const solfege = SOLFEGE_MAP[noteName];
  return {
    midi,
    scientific: `${noteName}${octave}`,
    solfege: `${solfege}${octave}`,
    isSharp: noteName.includes('#'),
    freq: 440 * Math.pow(2, (midi - 69) / 12),
  };
}

class GrandPianoEngine {
  private sampler: Tone.Sampler | null = null;
  private reverb: Tone.Reverb | null = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private sustainActive: boolean = false;
  private activeMidiNotes: Set<number> = new Set();
  private listeners: Set<NoteListener> = new Set();

  public async init(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;

    await Tone.start();

    this.reverb = new Tone.Reverb({
      decay: 2.2,
      preDelay: 0.01,
      wet: 0.18,
    }).toDestination();

    return new Promise((resolve) => {
      this.sampler = new Tone.Sampler({
        urls: {
          A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
          A1: 'A1.mp3', C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
          A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
          A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
          A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
          A5: 'A5.mp3', C6: 'C6.mp3', 'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
          A6: 'A6.mp3', C7: 'C7.mp3', 'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
          A7: 'A7.mp3', C8: 'C8.mp3',
        },
        release: 1.2,
        baseUrl: 'https://tonejs.github.io/audio/salamander/',
        onload: () => {
          this.isLoaded = true;
          this.isLoading = false;
          resolve();
        },
      }).connect(this.reverb!);
    });
  }

  public async load(): Promise<void> {
    return this.init();
  }

  public getLoadedState() {
    return this.isLoaded;
  }

  public setSustain(enabled: boolean) {
    this.sustainActive = enabled;
    if (!enabled && this.sampler) {
      this.sampler.releaseAll();
      this.activeMidiNotes.clear();
      this.notifyListeners();
    }
  }

  public releaseAll() {
    if (typeof window === 'undefined') return;
    if (this.sustainActive) return;
    this.sampler?.releaseAll();
    this.activeMidiNotes.clear();
    this.notifyListeners();
  }

  public async triggerAttack(midi: number, velocity: number = 0.85) {
    if (typeof window === 'undefined') return;
    if (!this.isLoaded) await this.init();
    const { scientific } = midiToNoteInfo(midi);
    this.sampler?.triggerAttack(scientific, Tone.now(), velocity);
    this.activeMidiNotes.add(midi);
    this.notifyListeners();
  }

  public triggerRelease(midi: number) {
    if (typeof window === 'undefined') return;
    if (this.sustainActive) return;
    const { scientific } = midiToNoteInfo(midi);
    this.sampler?.triggerRelease(scientific, Tone.now());
    this.activeMidiNotes.delete(midi);
    this.notifyListeners();
  }

  public async playNote(midiOrName: number | string, duration: number = 0.6, velocity: number = 0.85) {
    if (typeof window === 'undefined') return;
    if (!this.isLoaded) await this.init();
    const midi = typeof midiOrName === 'number'
      ? midiOrName
      : Tone.Frequency(midiOrName).toMidi();
    const { scientific } = midiToNoteInfo(midi);

    this.sampler?.triggerAttackRelease(scientific, duration, Tone.now(), velocity);
    this.activeMidiNotes.add(midi);
    this.notifyListeners();

    setTimeout(() => {
      this.activeMidiNotes.delete(midi);
      this.notifyListeners();
    }, duration * 1000);
  }

  public async playChord(notes: (number | string)[], duration: number = 1.2, velocity: number = 0.75) {
    if (typeof window === 'undefined') return;
    if (!this.isLoaded) await this.init();
    const midis = notes.map((n) => (typeof n === 'number' ? n : Tone.Frequency(n).toMidi()));
    const scientificNotes = midis.map((m) => midiToNoteInfo(m).scientific);

    this.sampler?.triggerAttackRelease(scientificNotes, duration, Tone.now(), velocity);
    midis.forEach((m) => this.activeMidiNotes.add(m));
    this.notifyListeners();

    setTimeout(() => {
      midis.forEach((m) => this.activeMidiNotes.delete(m));
      this.notifyListeners();
    }, duration * 1000);
  }

  public subscribe(listener: NoteListener): () => void {
    this.listeners.add(listener);
    listener(new Set(this.activeMidiNotes));
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const snapshot = new Set(this.activeMidiNotes);
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

export const grandPiano = new GrandPianoEngine();
