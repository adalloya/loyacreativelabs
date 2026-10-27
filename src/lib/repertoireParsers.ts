export type VocalTechnique = "chest" | "mixed" | "head" | "support";

export interface ParsedLyricLine {
  id: string;
  startTimeSec: number; // Tiempo exacto de entrada en segundos
  durationSec: number;
  chord: string;
  targetMidi: number; // Nota MIDI objetivo de la frase
  text: string;
  breatheBefore: boolean;
  technique: VocalTechnique;
  coachNote: string;
}

export interface RepertoireSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  keySignature: string;
  bpm: number;
  durationSec: number;
  sourceType: "preset" | "lrclib" | "ultrastar" | "chordpro";
  audioUrl?: string;
  lines: ParsedLyricLine[];
}

export interface LrcLibSearchResult {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

/**
 * 1. Consulta en vivo el catálogo abierto de LRCLIB (más de 3 millones de canciones sincronizadas)
 */
export async function searchLrcLibCatalog(query: string): Promise<LrcLibSearchResult[]> {
  if (!query.trim()) return [];
  const encoded = encodeURIComponent(query.trim());
  const response = await fetch(`https://lrclib.net/api/search?q=${encoded}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo conectar con el catálogo LRCLIB");
  }

  const data = (await response.json()) as LrcLibSearchResult[];
  // Priorizar resultados que tengan syncedLyrics (formato LRC con tiempos)
  return data
    .filter((item) => item.syncedLyrics || item.plainLyrics)
    .sort((a, b) => (b.syncedLyrics ? 1 : 0) - (a.syncedLyrics ? 1 : 0))
    .slice(0, 12);
}

/**
 * 2. Convierte un archivo o respuesta .LRC ([00:28.40] Texto) en líneas listas para Apple Music Sing
 */
export function parseLrcToLines(
  syncedLyrics: string | null,
  plainLyrics: string | null,
  defaultRootMidi = 52
): ParsedLyricLine[] {
  const lines: ParsedLyricLine[] = [];

  if (syncedLyrics && syncedLyrics.trim().length > 0) {
    const rawLines = syncedLyrics.split(/\r?\n/);
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

    const tempItems: Array<{ timeSec: number; text: string }> = [];

    for (const raw of rawLines) {
      const match = raw.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const millisStr = match[3];
        const millis =
          millisStr.length === 2
            ? parseInt(millisStr, 10) * 10
            : parseInt(millisStr, 10);
        const totalSec = minutes * 60 + seconds + millis / 1000;
        const cleanText = match[4].trim();
        if (cleanText.length > 0) {
          tempItems.push({ timeSec: Math.round(totalSec * 100) / 100, text: cleanText });
        }
      }
    }

    // Calcular duración entre línea y línea y asignar sugerencias vocales inteligentes
    const scaleOffsets = [0, 2, 3, 5, 7, 5, 3, 2];
    tempItems.forEach((item, idx) => {
      const nextTime = idx < tempItems.length - 1 ? tempItems[idx + 1].timeSec : item.timeSec + 4.5;
      const durationSec = Math.max(1.5, Math.min(8, Math.round((nextTime - item.timeSec) * 10) / 10));
      const offset = scaleOffsets[idx % scaleOffsets.length];
      const isLongPhrase = item.text.length > 36;
      const isHighSection = idx > tempItems.length * 0.35 && idx < tempItems.length * 0.75;

      lines.push({
        id: `lrc-${idx}-${Date.now()}`,
        startTimeSec: item.timeSec,
        durationSec,
        chord: isHighSection ? "Coro / Clímax" : "Verso",
        targetMidi: defaultRootMidi + (isHighSection ? 7 : offset),
        text: item.text,
        breatheBefore: true,
        technique: isHighSection ? "mixed" : isLongPhrase ? "support" : "chest",
        coachNote: isHighSection
          ? "Sección aguda: aligera el peso vocal y proyecta en máscara facial."
          : isLongPhrase
          ? "Frase extensa: administra la salida de aire con apoyo costodiafragmático."
          : "Mantén laringe estable y vocales redondas.",
      });
    });

    if (lines.length > 0) return lines;
  }

  // Fallback si la canción solo tiene letra plana (plainLyrics)
  if (plainLyrics) {
    const rawPlain = plainLyrics
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    rawPlain.forEach((text, idx) => {
      lines.push({
        id: `plain-${idx}-${Date.now()}`,
        startTimeSec: idx * 4.5,
        durationSec: 4.0,
        chord: "Verso",
        targetMidi: defaultRootMidi,
        text,
        breatheBefore: idx % 2 === 0,
        technique: "chest",
        coachNote: "Toca el botón de nota guía o ajusta el registro según la indicación de tu clase.",
      });
    });
  }

  return lines;
}

/**
 * 3. Parser de formato UltraStar Deluxe (.TXT) - Extrae BPM y notas MIDI reales sílaba por sílaba agrupadas por frase
 * Formato estándar UltraStar:
 * #TITLE:Cancion
 * #ARTIST:Artista
 * #BPM:140
 * : 0 4 7 Me
 * : 4 4 7 quie-
 * - 12
 */
export function parseUltraStarTxt(rawTxt: string): RepertoireSong {
  const rows = rawTxt.split(/\r?\n/);
  let title = "Canción UltraStar Importada";
  let artist = "Artista";
  let bpm = 120;
  let gapMs = 0;

  interface SyllableEvent {
    beat: number;
    durationBeats: number;
    midi: number;
    text: string;
  }

  const phrases: SyllableEvent[][] = [];
  let currentPhrase: SyllableEvent[] = [];

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#TITLE:")) {
      title = trimmed.replace("#TITLE:", "").trim();
    } else if (trimmed.startsWith("#ARTIST:")) {
      artist = trimmed.replace("#ARTIST:", "").trim();
    } else if (trimmed.startsWith("#BPM:")) {
      const parsedBpm = parseFloat(trimmed.replace("#BPM:", "").replace(",", ".").trim());
      if (!isNaN(parsedBpm) && parsedBpm > 0) bpm = Math.round(parsedBpm);
    } else if (trimmed.startsWith("#GAP:")) {
      const parsedGap = parseFloat(trimmed.replace("#GAP:", "").replace(",", ".").trim());
      if (!isNaN(parsedGap)) gapMs = parsedGap;
    } else if (trimmed.startsWith(":") || trimmed.startsWith("*") || trimmed.startsWith("F")) {
      // Nota normal (:), Golden Note (*) o Freestyle (F): Tipo Beat Duración Pitch Texto
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 5) {
        const beat = parseInt(parts[1], 10) || 0;
        const durationBeats = parseInt(parts[2], 10) || 2;
        const rawPitch = parseInt(parts[3], 10) || 0;
        const text = parts.slice(4).join(" ");
        // En UltraStar el pitch 0 suele mapear a C4 (60) o relativo a C3 (48)
        const midi = rawPitch > 24 && rawPitch < 96 ? rawPitch : 48 + ((rawPitch % 24) + 24) % 24;
        currentPhrase.push({ beat, durationBeats, midi, text });
      }
    } else if (trimmed.startsWith("-")) {
      // Separador de frase en UltraStar
      if (currentPhrase.length > 0) {
        phrases.push(currentPhrase);
        currentPhrase = [];
      }
    }
  }

  if (currentPhrase.length > 0) {
    phrases.push(currentPhrase);
  }

  const secondsPerBeat = 60 / (bpm * 4);
  const parsedLines: ParsedLyricLine[] = phrases.map((phrase, idx) => {
    const firstBeat = phrase[0].beat;
    const lastEvent = phrase[phrase.length - 1];
    const startTimeSec =
      Math.round((gapMs / 1000 + firstBeat * secondsPerBeat) * 100) / 100;
    const endTimeSec =
      gapMs / 1000 + (lastEvent.beat + lastEvent.durationBeats) * secondsPerBeat;
    const durationSec = Math.max(1.5, Math.round((endTimeSec - startTimeSec) * 10) / 10);

    // Nota MIDI dominante de la frase
    const avgMidi = Math.round(
      phrase.reduce((acc, item) => acc + item.midi, 0) / phrase.length
    );

    const joinedText = phrase
      .map((s) => s.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      id: `usdx-${idx}-${Date.now()}`,
      startTimeSec,
      durationSec,
      chord: `MIDI ${avgMidi}`,
      targetMidi: avgMidi,
      text: joinedText || `Frase melódica #${idx + 1}`,
      breatheBefore: true,
      technique: avgMidi >= 58 ? "mixed" : "chest",
      coachNote:
        avgMidi >= 58
          ? "Nota aguda detectada en el mapa UltraStar: usa voz mixta y evita empujar."
          : "Mantén afinación estable sobre la nota centro de la frase.",
    };
  });

  return {
    id: `ultrastar-${Date.now()}`,
    title,
    artist,
    keySignature: "Mapa Vocal MIDI",
    bpm,
    durationSec: parsedLines.length > 0 ? parsedLines[parsedLines.length - 1].startTimeSec + 6 : 180,
    sourceType: "ultrastar",
    lines: parsedLines,
  };
}

/**
 * 4. Parser de formato ChordPro ([Em]Me quieren agitar [Bm7]me incitan a gritar)
 */
export function parseChordProText(
  title: string,
  artist: string,
  rawChordPro: string,
  defaultRootMidi = 52
): RepertoireSong {
  const rawLines = rawChordPro
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const lines: ParsedLyricLine[] = [];

  rawLines.forEach((raw, idx) => {
    // Extraer todos los acordes entre corchetes [Em] [Bm7]
    const chordMatches = Array.from(raw.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);
    const cleanLyric = raw.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();

    if (!cleanLyric) return;

    const chordLabel = chordMatches.length > 0 ? chordMatches.join(" → ") : "Verso";
    const isChorus =
      cleanLyric.toLowerCase().includes("coro") ||
      chordLabel.toLowerCase().includes("coro") ||
      idx >= 4;

    lines.push({
      id: `chordpro-${idx}-${Date.now()}`,
      startTimeSec: idx * 4.5,
      durationSec: 4.2,
      chord: chordLabel,
      targetMidi: isChorus ? defaultRootMidi + 7 : defaultRootMidi,
      text: cleanLyric,
      breatheBefore: true,
      technique: isChorus ? "mixed" : "chest",
      coachNote: isChorus
        ? `Cambio de acordes (${chordLabel}): prepara resonancia alta antes de atacar.`
        : `Acordes base (${chordLabel}): proyecta con apoyo relajado.`,
    });
  });

  return {
    id: `chordpro-${Date.now()}`,
    title: title || "Canción ChordPro",
    artist: artist || "Repertorio Personal",
    keySignature: lines[0]?.chord.split(" ")[0] || "Em",
    bpm: 120,
    durationSec: lines.length * 4.5,
    sourceType: "chordpro",
    lines,
  };
}
