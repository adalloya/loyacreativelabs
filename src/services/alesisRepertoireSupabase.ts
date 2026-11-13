// src/services/alesisRepertoireSupabase.ts
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { LessonStep } from "@/components/studio/AlesisPianoStudioSection";

export interface OnlineRepertoireSong {
  id: string;
  title: string;
  artist: string;
  file: string;
  musicXml: string;
  sequence: LessonStep[];
  updatedAt?: string;
}

const ALESIS_REPERTOIRE_ALBUM = "Alesis Online Repertoire";

export const FUR_ELISE_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Für Elise (Extracto)</work-title>
  </work>
  <identification>
    <creator type="composer">Ludwig van Beethoven</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>3</beats><beat-type>8</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <notations><technical><fingering>5</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><alter>1</alter><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <accidental>sharp</accidental>
        <notations><technical><fingering>4</fingering></technical></notations>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <notations><technical><fingering>5</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><alter>1</alter><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <accidental>sharp</accidental>
        <notations><technical><fingering>4</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>E</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <notations><technical><fingering>5</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>B</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <accidental>natural</accidental>
        <notations><technical><fingering>4</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>C</step><octave>5</octave></pitch>
        <duration>1</duration>
        <type>16th</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch><step>A</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>quarter</type>
        <notations><technical><fingering>1</fingering></technical></notations>
      </note>
    </measure>
  </part>
</score-partwise>`;

export const ODE_TO_JOY_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Oda a la Alegría (Beethoven)</work-title>
  </work>
  <identification>
    <creator type="composer">Ludwig van Beethoven</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>4</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>5</fingering></technical></notations>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>5</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>4</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
    </measure>
    <measure number="3">
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>1</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>1</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
    </measure>
    <measure number="4">
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>3</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>2</duration>
        <type>half</type>
        <notations><technical><fingering>2</fingering></technical></notations>
      </note>
    </measure>
  </part>
</score-partwise>`;

export const DEFAULT_ONLINE_REPERTOIRE: OnlineRepertoireSong[] = [
  {
    id: "alesis-fur-elise",
    title: "Für Elise (Extracto)",
    artist: "Ludwig van Beethoven",
    file: "songs/fur_elise.xml",
    musicXml: FUR_ELISE_XML,
    sequence: [
      { note: 76, name: "E5 (Mi)", lyric: "Mi5 - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
      { note: 75, name: "D#5 (Re#)", lyric: "Re#5 - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 76, name: "E5 (Mi)", lyric: "Mi5 - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
      { note: 75, name: "D#5 (Re#)", lyric: "Re#5 - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 76, name: "E5 (Mi)", lyric: "Mi5 - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
      { note: 71, name: "B4 (Si)", lyric: "Si4 - Dedo 2 (Índice)", finger: 2, hand: "Mano Der." },
      { note: 74, name: "D5 (Re)", lyric: "Re5 - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 72, name: "C5 (Do)", lyric: "Do5 - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 69, name: "A4 (La)", lyric: "La4 - Dedo 1 (Pulgar - Reposo)", finger: 1, hand: "Mano Der." },
    ],
  },
  {
    id: "alesis-ode-to-joy",
    title: "Oda a la Alegría (Beethoven)",
    artist: "Ludwig van Beethoven",
    file: "songs/ode_to_joy.xml",
    musicXml: ODE_TO_JOY_XML,
    sequence: [
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 65, name: "F4 (Fa)", lyric: "Fa - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 67, name: "G4 (Sol)", lyric: "Sol - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
      { note: 67, name: "G4 (Sol)", lyric: "Sol - Dedo 5 (Meñique)", finger: 5, hand: "Mano Der." },
      { note: 65, name: "F4 (Fa)", lyric: "Fa - Dedo 4 (Anular)", finger: 4, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2 (Índice)", finger: 2, hand: "Mano Der." },
      { note: 60, name: "C4 (Do)", lyric: "Do - Dedo 1 (Pulgar)", finger: 1, hand: "Mano Der." },
      { note: 60, name: "C4 (Do)", lyric: "Do - Dedo 1 (Pulgar)", finger: 1, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2 (Índice)", finger: 2, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 64, name: "E4 (Mi)", lyric: "Mi - Dedo 3 (Medio)", finger: 3, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2 (Índice)", finger: 2, hand: "Mano Der." },
      { note: 62, name: "D4 (Re)", lyric: "Re - Dedo 2 (Cierre)", finger: 2, hand: "Mano Der." },
    ],
  },
];

const STEP_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const SOLFEGE_MAP: Record<string, string> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  F: "Fa",
  G: "Sol",
  A: "La",
  B: "Si",
};

/**
 * Convierte cualquier partitura MusicXML en una secuencia interactiva de pasos (LessonStep[])
 * para iluminar los LEDs del teclado Alesis en 3 colores.
 */
export function parseMusicXmlToSequence(xmlText: string): LessonStep[] {
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return [];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const noteNodes = Array.from(doc.getElementsByTagName("note"));
    const steps: LessonStep[] = [];

    for (const noteEl of noteNodes) {
      // Omitir silencios (<rest/>)
      if (noteEl.getElementsByTagName("rest").length > 0) continue;

      const pitchEl = noteEl.getElementsByTagName("pitch")[0];
      if (!pitchEl) continue;

      const stepLetter = pitchEl.getElementsByTagName("step")[0]?.textContent?.trim() || "C";
      const octaveNum = parseInt(
        pitchEl.getElementsByTagName("octave")[0]?.textContent?.trim() || "4",
        10
      );
      const alterNum = parseInt(
        pitchEl.getElementsByTagName("alter")[0]?.textContent?.trim() || "0",
        10
      );

      const baseSemitone = STEP_SEMITONES[stepLetter] ?? 0;
      const midiNote = (octaveNum + 1) * 12 + baseSemitone + alterNum;

      const fingeringText = noteEl.getElementsByTagName("fingering")[0]?.textContent?.trim();
      const finger = fingeringText ? Math.min(5, Math.max(1, parseInt(fingeringText, 10) || 1)) : 1;

      const accidentalSymbol = alterNum === 1 ? "#" : alterNum === -1 ? "b" : "";
      const solfege = `${SOLFEGE_MAP[stepLetter] || stepLetter}${accidentalSymbol}`;
      const noteName = `${stepLetter}${accidentalSymbol}${octaveNum} (${solfege})`;

      steps.push({
        note: midiNote,
        name: noteName,
        lyric: `${solfege}${octaveNum} - Dedo ${finger}`,
        finger,
        hand: midiNote < 60 ? "Mano Izq." : "Mano Der.",
      });
    }

    return steps;
  } catch (err) {
    console.warn("[AlesisRepertoire] Error parseando MusicXML:", err);
    return [];
  }
}

/**
 * Obtiene y sincroniza el repertorio online de Alesis desde la tabla 'songs' de Supabase
 * de Loya Creative Lab. Si las piezas base no están en la nube, las inserta automáticamente.
 */
export async function fetchOnlineRepertoireFromSupabase(): Promise<OnlineRepertoireSong[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_ONLINE_REPERTOIRE;
  }

  try {
    // 1. Asegurar que las piezas base del onlineRepertoire existan en la BD de Supabase
    const upsertPayload = DEFAULT_ONLINE_REPERTOIRE.map((item) => ({
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: ALESIS_REPERTOIRE_ALBUM,
      duration: item.sequence.length * 2,
      audio_url: item.file,
      plain_lyrics: item.musicXml,
      annotations: item.sequence,
      updated_at: new Date().toISOString(),
    }));

    await supabase.from("songs").upsert(upsertPayload, { onConflict: "id" });

    // 2. Consultar todo el repertorio de Alesis almacenado en Supabase
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .eq("album", ALESIS_REPERTOIRE_ALBUM)
      .order("updated_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_ONLINE_REPERTOIRE;
    }

    return data.map((row: any) => {
      const fallback = DEFAULT_ONLINE_REPERTOIRE.find((d) => d.id === row.id);
      const xml = row.plain_lyrics || fallback?.musicXml || FUR_ELISE_XML;
      const seq: LessonStep[] =
        Array.isArray(row.annotations) && row.annotations.length > 0
          ? row.annotations
          : fallback?.sequence || parseMusicXmlToSequence(xml);

      return {
        id: row.id,
        title: row.title,
        artist: row.artist || "Ludwig van Beethoven",
        file: row.audio_url || fallback?.file || `songs/${row.id}.xml`,
        musicXml: xml,
        sequence: seq,
        updatedAt: row.updated_at,
      };
    });
  } catch (err) {
    console.warn("[AlesisRepertoire] Fallback a repertorio local:", err);
    return DEFAULT_ONLINE_REPERTOIRE;
  }
}

/**
 * Guarda una nueva partitura MusicXML subida por el usuario directamente en Supabase
 * dentro del catálogo 'Alesis Online Repertoire'.
 */
export async function saveCustomXmlToSupabase(
  fileName: string,
  xmlContent: string
): Promise<OnlineRepertoireSong> {
  const cleanTitle = fileName.replace(/\.(musicxml|xml)$/i, "").replace(/[_-]+/g, " ");
  const id = `alesis-xml-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const parsedSequence = parseMusicXmlToSequence(xmlContent);
  const sequence: LessonStep[] =
    parsedSequence.length > 0
      ? parsedSequence
      : DEFAULT_ONLINE_REPERTOIRE[0].sequence;

  const newSong: OnlineRepertoireSong = {
    id,
    title: cleanTitle,
    artist: "Partitura MusicXML",
    file: `songs/${fileName}`,
    musicXml: xmlContent,
    sequence,
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from("songs").upsert({
        id: newSong.id,
        title: newSong.title,
        artist: newSong.artist,
        album: ALESIS_REPERTOIRE_ALBUM,
        duration: sequence.length * 2,
        audio_url: newSong.file,
        plain_lyrics: newSong.musicXml,
        annotations: newSong.sequence,
        updated_at: newSong.updatedAt,
      });
    } catch (err) {
      console.warn("[AlesisRepertoire] Error guardando XML en Supabase:", err);
    }
  }

  return newSong;
}
