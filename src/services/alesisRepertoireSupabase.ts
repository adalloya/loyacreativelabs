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
 * Obtiene y sincroniza el repertorio online de Alesis desde la tabla 'public.songs'
 * del proyecto Supabase (femjbpqeejfymdkuagti) de Loya Creative Lab.
 * Compatible tanto con columnas (file_url, xml_content) como con (audio_url, plain_lyrics).
 */
export async function fetchOnlineRepertoireFromSupabase(): Promise<OnlineRepertoireSong[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_ONLINE_REPERTOIRE;
  }

  try {
    // 1. Asegurar que las piezas base existan en public.songs
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

    // 2. Consultar todas las partituras almacenadas en public.songs
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_ONLINE_REPERTOIRE;
    }

    // Filtrar filas que contienen partituras XML (por album o porque tienen xml_content / <?xml)
    const xmlRows = data.filter((row: any) => {
      const xmlCandidate = row.xml_content || row.plain_lyrics || "";
      return (
        row.album === ALESIS_REPERTOIRE_ALBUM ||
        Boolean(row.xml_content) ||
        xmlCandidate.includes("<score-partwise") ||
        xmlCandidate.includes("<?xml")
      );
    });

    if (xmlRows.length === 0) {
      return DEFAULT_ONLINE_REPERTOIRE;
    }

    return xmlRows.map((row: any) => {
      const fallback = DEFAULT_ONLINE_REPERTOIRE.find((d) => d.id === row.id);
      const xml = row.xml_content || row.plain_lyrics || fallback?.musicXml || FUR_ELISE_XML;
      const fileUrl = row.file_url || row.audio_url || fallback?.file || `songs/${row.id}.xml`;
      const seq: LessonStep[] =
        Array.isArray(row.annotations) && row.annotations.length > 0
          ? row.annotations
          : fallback?.sequence || parseMusicXmlToSequence(xml);

      return {
        id: String(row.id),
        title: row.title,
        artist: row.artist || "Partitura Cloud",
        file: fileUrl,
        musicXml: xml,
        sequence: seq,
        updatedAt: row.created_at || row.updated_at,
      };
    });
  } catch (err) {
    console.warn("[AlesisRepertoire] Fallback a repertorio local:", err);
    return DEFAULT_ONLINE_REPERTOIRE;
  }
}

/**
 * Sube el archivo .xml al bucket 'sheet-music' de Supabase Storage y registra la partitura
 * en la tabla 'public.songs' (proyecto femjbpqeejfymdkuagti).
 */
export async function saveCustomXmlToSupabase(
  fileName: string,
  xmlContent: string,
  rawFile?: File
): Promise<{ song: OnlineRepertoireSong; storageUploaded: boolean }> {
  const cleanTitle = fileName.replace(/\.(musicxml|xml)$/i, "").replace(/[_-]+/g, " ");
  const id = `alesis-xml-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const parsedSequence = parseMusicXmlToSequence(xmlContent);
  const sequence: LessonStep[] =
    parsedSequence.length > 0
      ? parsedSequence
      : DEFAULT_ONLINE_REPERTOIRE[0].sequence;

  let publicFileUrl = `songs/${fileName}`;
  let storageUploaded = false;

  if (isSupabaseConfigured) {
    // 1. Subir archivo al bucket 'sheet-music' de Supabase Storage
    try {
      const storageFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const fileBody =
        rawFile || new Blob([xmlContent], { type: "application/vnd.recordare.musicxml+xml" });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sheet-music")
        .upload(storageFileName, fileBody, {
          contentType: "text/xml",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("sheet-music")
          .getPublicUrl(storageFileName);
        if (publicUrlData?.publicUrl) {
          publicFileUrl = publicUrlData.publicUrl;
          storageUploaded = true;
        }
      }
    } catch (storageErr) {
      console.warn("[AlesisRepertoire] Aviso al subir a bucket sheet-music:", storageErr);
    }

    // 2. Guardar registro en la tabla 'public.songs'
    try {
      // Intento 1: Con columnas extendidas (file_url, xml_content) + columnas estándar
      const { error: extError } = await supabase.from("songs").insert([
        {
          id,
          title: fileName,
          artist: "Partitura MusicXML",
          album: ALESIS_REPERTOIRE_ALBUM,
          duration: sequence.length * 2,
          file_url: publicFileUrl,
          xml_content: xmlContent,
          audio_url: publicFileUrl,
          plain_lyrics: xmlContent,
          annotations: sequence,
          updated_at: new Date().toISOString(),
        },
      ]);

      // Intento 2: Si el usuario aún no ejecutó el ALTER TABLE para file_url/xml_content, usar las columnas nativas de songs
      if (extError) {
        await supabase.from("songs").upsert({
          id,
          title: fileName,
          artist: "Partitura MusicXML",
          album: ALESIS_REPERTOIRE_ALBUM,
          duration: sequence.length * 2,
          audio_url: publicFileUrl,
          plain_lyrics: xmlContent,
          annotations: sequence,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn("[AlesisRepertoire] Error guardando XML en Supabase:", err);
    }
  }

  const newSong: OnlineRepertoireSong = {
    id,
    title: fileName,
    artist: "Partitura MusicXML",
    file: publicFileUrl,
    musicXml: xmlContent,
    sequence,
    updatedAt: new Date().toISOString(),
  };

  return { song: newSong, storageUploaded };
}
