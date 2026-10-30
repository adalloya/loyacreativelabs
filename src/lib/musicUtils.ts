// Utilidades de Música, Metadatos (iTunes Search API), Letras Sincronizadas (LRCLIB) y Parser LRC

export interface LyricLine {
  id: string;
  time: number | null; // Segundos (ej. 14.32) o null si aún no está sincronizado
  text: string;
  vocalCue?: string;
}

export interface StudioSong {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  audioUrl: string; // Object URL local o stream
  audioFileName?: string;
  duration?: number;
  bpm?: number;
  lyrics: LyricLine[];
  isSynced: boolean;
  createdAt: number;
}

/**
 * Convierte formato LRC estándar "[00:14.32] Texto de la frase" a un arreglo estructurado de LyricLine.
 * Soporta múltiples marcas de tiempo por línea y milisegundos de 2 o 3 dígitos.
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== "string") return [];

  const rawLines = lrcText.split(/\r?\n/);
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const result: { time: number; text: string }[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Ignorar etiquetas de metadatos como [ar:...], [ti:...], [length:...]
    if (/^\[(ti|ar|al|by|offset|length|re|ve):/i.test(trimmed)) {
      continue;
    }

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      const cleanText = trimmed.replace(timeRegex, "").trim();
      for (const match of matches) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const msRaw = match[3] || "0";
        const milliseconds = parseInt(msRaw.padEnd(3, "0").slice(0, 3), 10);
        const totalSeconds = minutes * 60 + seconds + milliseconds / 1000;

        if (cleanText) {
          result.push({
            time: Number(totalSeconds.toFixed(2)),
            text: cleanText,
          });
        }
      }
    }
  }

  // Ordenar por tiempo cronológico
  result.sort((a, b) => a.time - b.time);

  return result.map((item, idx) => ({
    id: `line-${idx}-${Math.round(item.time * 100)}`,
    time: item.time,
    text: item.text,
  }));
}

/**
 * Convierte texto plano de letra en renglones listos para el modo Tap-to-Sync.
 */
export function parsePlainLyrics(plainText: string): LyricLine[] {
  if (!plainText || typeof plainText !== "string") return [];

  return plainText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text, idx) => ({
      id: `line-plain-${idx}`,
      time: null,
      text,
    }));
}

/**
 * Exporta un arreglo de LyricLine de vuelta a formato estándar .LRC
 */
export function exportToLRC(lyrics: LyricLine[], title = "", artist = ""): string {
  const headerLines: string[] = [];
  if (title) headerLines.push(`[ti:${title}]`);
  if (artist) headerLines.push(`[ar:${artist}]`);
  headerLines.push("[by:Acapella Studio]");

  const bodyLines = lyrics.map((line) => {
    if (line.time === null) {
      return `[00:00.00] ${line.text}`;
    }
    const minutes = Math.floor(line.time / 60);
    const seconds = Math.floor(line.time % 60);
    const hundredths = Math.floor((line.time % 1) * 100);
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    const xx = String(hundredths).padStart(2, "0");
    return `[${mm}:${ss}.${xx}] ${line.text}`;
  });

  return [...headerLines, "", ...bodyLines].join("\n");
}

/**
 * Busca metadatos oficiales en iTunes Search API y letras sincronizadas en LRCLIB API.
 * Ambas APIs son públicas, gratuitas y admiten CORS nativo en el navegador.
 */
export async function fetchSongMetadataAndLyrics(
  queryTitle: string,
  queryArtist = ""
): Promise<{
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration?: number;
  lyrics: LyricLine[];
  isAlreadySynced: boolean;
}> {
  const cleanTitle = queryTitle.trim();
  const cleanArtist = queryArtist.trim();
  const searchTerm = encodeURIComponent(`${cleanArtist} ${cleanTitle}`.trim());

  let officialTitle = cleanTitle;
  let officialArtist = cleanArtist;
  let album = "";
  let coverUrl = "";
  let duration: number | undefined;

  // A) Buscar carátula en alta definición y datos oficiales en iTunes Search API
  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`
    );
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      const track = itunesData.results?.[0];
      if (track) {
        officialTitle = track.trackName || cleanTitle;
        officialArtist = track.artistName || cleanArtist;
        album = track.collectionName || "";
        // Reemplazar 100x100 por 600x600 para obtener carátula HD
        coverUrl = track.artworkUrl100?.replace("100x100bb", "600x600bb") || "";
        if (track.trackTimeMillis) {
          duration = Math.round(track.trackTimeMillis / 1000);
        }
      }
    }
  } catch (err) {
    console.warn("[musicUtils] iTunes Search API omitido:", err);
  }

  // B) Buscar letra (LRC sincronizada o plana) en LRCLIB API
  let lyrics: LyricLine[] = [];
  let isAlreadySynced = false;

  try {
    const lrcUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
      officialTitle
    )}&artist_name=${encodeURIComponent(officialArtist)}`;

    const lrcRes = await fetch(lrcUrl);
    if (lrcRes.ok) {
      const lrcData = await lrcRes.json();
      if (Array.isArray(lrcData) && lrcData.length > 0) {
        // Encontrar el mejor resultado que tenga letra
        const bestWithSync = lrcData.find((item) => item.syncedLyrics);
        const bestMatch = bestWithSync || lrcData[0];

        if (bestMatch?.syncedLyrics) {
          lyrics = parseLRC(bestMatch.syncedLyrics);
          isAlreadySynced = lyrics.length > 0;
        } else if (bestMatch?.plainLyrics) {
          lyrics = parsePlainLyrics(bestMatch.plainLyrics);
        }

        if (!album && bestMatch?.albumName) {
          album = bestMatch.albumName;
        }
        if (!duration && bestMatch?.duration) {
          duration = Math.round(bestMatch.duration);
        }
      }
    }
  } catch (err) {
    console.warn("[musicUtils] LRCLIB API omitido:", err);
  }

  return {
    title: officialTitle,
    artist: officialArtist,
    album,
    coverUrl,
    duration,
    lyrics,
    isAlreadySynced,
  };
}

// Clave de almacenamiento local para la librería
const STORAGE_KEY = "acapella_studio_library_v1";

// Canciones de muestra para la librería inicial
const SAMPLE_LIBRARY: StudioSong[] = [
  {
    id: "sample-yellow",
    title: "Yellow",
    artist: "Coldplay",
    album: "Parachutes",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bf/45/b9/bf45b985-7822-7776-ce13-75ecab18ce42/00602537877271.rgb.jpg/600x600bb.jpg",
    audioUrl: "",
    duration: 269,
    isSynced: true,
    createdAt: Date.now() - 86400000,
    lyrics: [
      { id: "line-0", time: 14.2, text: "Look at the stars" },
      { id: "line-1", time: 17.5, text: "Look how they shine for you" },
      { id: "line-2", time: 22.1, text: "And everything you do" },
      { id: "line-3", time: 27.8, text: "Yeah, they were all yellow" },
      { id: "line-4", time: 33.4, text: "I came along" },
      { id: "line-5", time: 36.8, text: "I wrote a song for you" },
      { id: "line-6", time: 41.5, text: "And all the things you do" },
      { id: "line-7", time: 47.0, text: "And it was called Yellow" },
      { id: "line-8", time: 54.2, text: "So then I took my turn" },
      { id: "line-9", time: 59.5, text: "Oh, what a thing to have done" },
      { id: "line-10", time: 66.0, text: "And it was all yellow" },
    ],
  },
  {
    id: "sample-fly-me",
    title: "Fly Me to the Moon",
    artist: "Frank Sinatra",
    album: "It Might as Well Be Swing",
    coverUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/95/92/47/95924765-b1a9-b3b3-579e-4f113a362f79/00602537533085.rgb.jpg/600x600bb.jpg",
    audioUrl: "",
    duration: 147,
    isSynced: true,
    createdAt: Date.now() - 43200000,
    lyrics: [
      { id: "f-0", time: 4.5, text: "Fly me to the moon" },
      { id: "f-1", time: 8.2, text: "Let me play among the stars" },
      { id: "f-2", time: 12.6, text: "Let me see what spring is like on" },
      { id: "f-3", time: 16.2, text: "Jupiter and Mars" },
      { id: "f-4", time: 21.0, text: "In other words, hold my hand" },
      { id: "f-5", time: 28.5, text: "In other words, baby, kiss me" },
      { id: "f-6", time: 36.8, text: "Fill my heart with song" },
      { id: "f-7", time: 40.5, text: "And let me sing forevermore" },
      { id: "f-8", time: 45.2, text: "You are all I long for" },
      { id: "f-9", time: 49.0, text: "All I worship and adore" },
    ],
  },
];

/**
 * Carga la librería de canciones guardadas en localStorage.
 */
export function loadStudioLibrary(): StudioSong[] {
  if (typeof window === "undefined") return SAMPLE_LIBRARY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SAMPLE_LIBRARY;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_LIBRARY;
  } catch (err) {
    console.error("[musicUtils] Error al cargar la librería de canciones:", err);
    return SAMPLE_LIBRARY;
  }
}

/**
 * Guarda la librería de canciones en localStorage.
 */
export function saveStudioLibrary(songs: StudioSong[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (err) {
    console.error("[musicUtils] Error al guardar la librería:", err);
  }
}
